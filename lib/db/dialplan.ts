import { create } from 'xmlbuilder2'
import { prisma } from '@/lib/prisma'


interface DialplanParams {
  callerContext: string;
  hostname: string;
  destinationNumber?: string;
  sipFromHost?: string;
}

interface DialplanResponse {
  xml: string;
  context: string;
  sequence: number;
}

// Helper to check if a UUID is valid
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate XML for a dialplan entry from its details
 * This is used when the 'xml' column is null in pbx_dialplans.
 */
function generateDialplanXmlFromDetails(dialplan: any, details: any[]): string {
  try {
    const root = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
      .ele('extension', {
        name: dialplan.name,
        continue: dialplan.dp_continue,
        uuid: dialplan.id
      });

    // Group details by group number for correct condition/action structure
    const groupedDetails = details.reduce((acc: { [key: number]: any[] }, detail: any) => {
      const group = Number(detail.group);
      if (!acc[group]) acc[group] = [];
      acc[group].push(detail);
      return acc;
    }, {});

    // Process each group, ordered by group number
    Object.keys(groupedDetails).sort((a, b) => Number(a) - Number(b)).forEach(groupKey => {
      const groupDetails = groupedDetails[Number(groupKey)];
      const enabledDetails = groupDetails.filter((d: any) => d.enabled === 'true');
      const conditions = enabledDetails.filter((d: any) => d.tag === 'condition');
      const actions = enabledDetails.filter((d: any) => d.tag === 'action');
      const antiActions = enabledDetails.filter((d: any) => d.tag === 'anti-action');

      // Create condition elements only if there are conditions
      if (conditions.length > 0) {
          conditions.forEach((condition: any) => {
              const conditionElem = root.ele('condition', {
                  field: condition.type || '',
                  expression: condition.data || ''
              });

              if (condition.dp_break) {
                  conditionElem.att('break', condition.dp_break);
              }

              // Add actions within the condition
              actions.forEach((action: any) => {
                  const actionElem = conditionElem.ele('action', {
                      application: action.type,
                      data: action.data
                  });
                  if (action.inline === 'true') {
                      actionElem.att('inline', 'true');
                  }
              });

              // Add anti-actions within the condition
              antiActions.forEach((antiAction: any) => {
                  const antiActionElem = conditionElem.ele('anti-action', {
                      application: antiAction.type,
                      data: antiAction.data
                  });
                  if (antiAction.inline === 'true') {
                      antiActionElem.att('inline', 'true');
                  }
              });
          });
      } else {
          actions.forEach((action: any) => {
              const actionElem = root.ele('action', {
                  application: action.type,
                  data: action.data
              });
              if (action.inline === 'true') {
                  actionElem.att('inline', 'true');
              }
          });
          antiActions.forEach((antiAction: any) => {
              const antiActionElem = root.ele('anti-action', {
                  application: antiAction.type,
                  data: antiAction.data
              });
              if (antiAction.inline === 'true') {
                  antiActionElem.att('inline', 'true');
              }
          });
      }
    });


    return root.end({ prettyPrint: false }); // Use prettyPrint: false for production
  } catch (error) {
    console.error(`Error generating XML for dialplan ${dialplan.id}:`, error);
    return '';
  }
}

/**
 * Get dialplans by context, ordered by sequence.
 * Fetches from both defaults and tenant-specific tables.
 */
export async function getDialplanByContext(
  params: DialplanParams
): Promise<DialplanResponse[]> {
  const {
    callerContext,
    hostname,
    destinationNumber,
    sipFromHost 
  } = params;

  try {
    const domainToCheck = sipFromHost || callerContext;
    console.log(`Domain to check: ${domainToCheck}`);
    const domainMapping = await prisma.domain_mapping.findFirst({
      where: { fullDomain: domainToCheck },
      select: { fullDomainUid: true } 
    });

    // If domain mapping doesn't exist, we might still need global/public dialplans
    const domainId = domainMapping?.fullDomainUid;

    // Fetch Global/Public Dialplans from pbx_dialplan_defaults (shared table)
    const defaultDialplans = await prisma.pbx_dialplan_defaults.findMany({
      where: {
        AND: [
          {
            OR: [
              { context: 'global' },
              { context: 'public' }
            ]
          },
          { dp_enabled: 'true' },
          destinationNumber ? {
            OR: [
              { number: destinationNumber },
              { number: null }
            ]
          } : {}
        ]
      },
      orderBy: { sequence: 'asc' },
      select: {
        xml: true,
        context: true,
        sequence: true,
        id: true,
        name: true,
        dp_continue: true,
        enabled: true,
        number: true, 
      }
    });

    // Fetch Domain-Specific Dialplans from pbx_dialplans (shared table)
    const domainDialplans = await prisma.pbx_dialplans.findMany({
      where: {
        AND: [
          { 
            OR: [
              { context: domainToCheck },
              { context: '${domain_name}' }
            ]
          },
          { enabled: 'true' },
          domainId ? { domain_id_id: domainId } : { domain_id_id: null },
          {
            OR: [
              { hostname },
              { hostname: null }
            ]
          },
          // Match destination number if provided, otherwise include null destinations
          destinationNumber ? {
            OR: [
              { number: destinationNumber },
              { number: null }
            ]
          } : {}
        ]
      },
      include: {
        pbx_dialplan_details: {
          where: { enabled: 'true' },
          orderBy: [
            { group: 'asc' },
            { sequence: 'asc' }
          ]
        }
      },
      orderBy: { sequence: 'asc' }
    });

    // Combine, Process, and Sort Dialplans
    const combinedDialplans = [
      ...defaultDialplans.map(dp => ({
        ...dp,
        details: [],
        isDefault: true
      })),
      ...domainDialplans.map(dp => ({
        ...dp,
        details: dp.pbx_dialplan_details || [],
        isDefault: false
      }))
    ].sort((a, b) => Number(a.sequence) - Number(b.sequence)); 

    // Map to final response format, generating XML if needed
    const finalDialplans: DialplanResponse[] = combinedDialplans
      .map(dp => {
        if (dp.enabled !== 'true') return null;

      const xmlContent = dp.xml || (!dp.isDefault ? generateDialplanXmlFromDetails(dp, dp.details) : '');
      return {
        xml: xmlContent,
        context: dp.context || callerContext,
        sequence: Number(dp.sequence)
      };
    }).filter((dp): dp is DialplanResponse => dp !== null && !!dp.xml);

    return finalDialplans;


  } catch (error) {
    console.error(`Error fetching dialplan for context ${callerContext}:`, error);
    // Return empty allows FreeSWITCH to potentially try other contexts
    return [];
    // throw new Error(`Failed to fetch dialplan for context ${callerContext}`);
  }
}

/**
 * Get system variables (assuming they are in pbx_default_settings)
 * NOTE: Ensure table name and schema access are correct.
 */
export async function getSystemVariables() {
  try {
    const settings = await prisma.pbx_default_settings.findMany({
      where: {
        category: 'System Variables',
        enabled: 'true'
      },
      select: {
        subcategory: true,
        value: true 
      },
      orderBy: {
        subcategory: 'asc'
      }
    });
    return settings.map(s => ({
        name: s.subcategory,
        value: s.value
    }));
  } catch (error) {
    console.error("Error fetching system variables:", error);
    return [];
  }
}