import { create } from 'xmlbuilder2'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  Dialplans,
  DialplanDetails,
  DialplanDefaults,
  DialplanDefaultXmlDisplay,
  DialplanXmlDisplay,
  DatabaseError 
} from '@/lib/db/types'
import { verifyAuthUser } from './q'

interface GetDialplansOptions {
  uid: string;
  skip?: number;
  take?: number;
  searchTerm?: string;
  enabled?: boolean;
}

interface GetDialplanDefaultsOptions {
  skip?: number;
  take?: number;
  searchTerm?: string;
  enabled?: boolean;
}


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
{/*    const defaultDialplans = await prisma.pbx_dialplan_defaults.findMany({
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
    });*/}

    // Fetch Domain-Specific Dialplans from pbx_dialplans (shared table)
{/*    const domainDialplans = await prisma.pbx_dialplans.findMany({
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
    }); */}

    const [defaultDialplans, domainDialplans] = await Promise.all([
      // Default dialplans (global/public)
      prisma.pbx_dialplan_defaults.findMany({
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
      }),

      // Domain-specific dialplans
      prisma.pbx_dialplans.findMany({
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
        }
      })
    ]);

    // Combine, Process, and Sort Dialplans
    const allDialplans = [
      ...defaultDialplans.map(dp => ({
        ...dp,
        details: [],
        isDefault: true,
        actualSequence: Number(dp.sequence),
        source: 'default' as const
      })),
      ...domainDialplans.map(dp => ({
        ...dp,
        details: dp.pbx_dialplan_details || [],
        isDefault: false,
        actualSequence: Number(dp.sequence),
        source: 'domain' as const
      }))
    ];

    const sortedDialplans = allDialplans.sort((a, b) => {
      // First compare by sequence
      const seqCompare = a.actualSequence - b.actualSequence;
      if (seqCompare !== 0) return seqCompare;
      
      // If sequences are equal, prefer domain-specific over defaults
      if (a.source !== b.source) {
        return a.source === 'domain' ? -1 : 1;
      }
      
      return 0;
    });

    console.log('Sorted Dialplan Sequences:', 
      sortedDialplans.map(dp => ({
        sequence: dp.actualSequence,
        source: dp.source,
        name: dp.name
      }))
    );

    // Map to final response format, generating XML if needed
    const finalDialplans: DialplanResponse[] = sortedDialplans
      .map(dp => {
        if (dp.enabled !== 'true') return null;

      const xmlContent = dp.xml || (!dp.isDefault ? generateDialplanXmlFromDetails(dp, dp.details) : '');

      if (!xmlContent) return null;

      return {
        xml: xmlContent,
        context: dp.context || domainToCheck,
        sequence: dp.actualSequence
      };
    }).filter((dp): dp is DialplanResponse => dp !== null);

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


/**
 * Get all domain-specific dialplans for a tenant
 */
export async function getDomainDialplans({
  uid,
  skip = 0,
  take = 50,
  searchTerm
}: Omit<GetDialplansOptions, 'enabled'>): Promise<{ 
  dialplans: DialplanXmlDisplay[]; 
  total: number; 
}> {
  try {
    const userMapping = await verifyAuthUser(uid);
    if (!userMapping.exists || !userMapping.mapping || !userMapping.tenant) {
      throw new Error('User mapping not found');
    }

    const domainMapping = await prisma.domain_mapping.findFirst({
      where: { tenantId: userMapping.tenant.id }
    });

    if (!domainMapping) {
      throw new Error('Domain mapping not found for tenant');
    }

    const where: Prisma.pbx_dialplansWhereInput = {
      AND: [
        { domain_id_id: domainMapping.fullDomainUid },
        searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { context: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        } : {}
      ]
    };

    const [dialplans, total] = await Promise.all([
      prisma.pbx_dialplans.findMany({
        where,
        select: {
          id: true,
          context: true,
          name: true,
          number: true,
          sequence: true,
          xml: true,
          enabled: true,
          pbx_dialplan_details: {
            where: { enabled: 'true' },
            select: {
              tag: true,
              type: true,
              data: true,
              inline: true,
              dp_break: true,
              group: true,
              sequence: true,
              enabled: true
            },
            orderBy: [
              { group: 'asc' },
              { sequence: 'asc' }
            ]
          }
        },
        orderBy: [
          { sequence: 'asc' },
          { name: 'asc' }
        ],
        skip,
        take
      }),
      prisma.pbx_dialplans.count({ where })
    ]);

    return {
      dialplans: dialplans.map(dp => ({
        ...dp,
        source: 'domain' as const,
        details: dp.pbx_dialplan_details
      })),
      total
    };
  } catch (error) {
    console.error('Error fetching domain dialplans:', error);
    throw new DatabaseError('Failed to fetch domain dialplans');
  }
}


/**
 * Get all default dialplans (global/public)
 */
export async function getDefaultDialplans({
  skip = 0,
  take = 50,
  searchTerm
}: Omit<GetDialplanDefaultsOptions, 'enabled'>): Promise<{ 
  dialplans: DialplanDefaultXmlDisplay[]; 
  total: number; 
}> {
  try {
    const where: Prisma.pbx_dialplan_defaultsWhereInput = {
      AND: [
        searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { context: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        } : {}
      ]
    };

    const [dialplans, total] = await Promise.all([
      prisma.pbx_dialplan_defaults.findMany({
        where,
        select: {
          id: true,
          context: true,
          name: true,
          number: true,
          sequence: true,
          xml: true,
          dp_enabled: true
        },
        orderBy: [
          { sequence: 'asc' },
          { name: 'asc' }
        ],
        skip,
        take
      }),
      prisma.pbx_dialplan_defaults.count({ where })
    ]);

    return {
      dialplans: dialplans.map(dp => ({
        ...dp,
        source: 'default' as const
      })),
      total
    };
  } catch (error) {
    console.error('Error fetching default dialplans:', error);
    throw new DatabaseError('Failed to fetch default dialplans');
  }
}


/**
 * Get a specific domain dialplan by ID
 */
export async function getDomainDialplanById(
  id: string,
  tenantId: string
): Promise<Dialplans | null> {
  try {
    const dialplan = await prisma.pbx_dialplans.findFirst({
      where: {
        id,
        domain_id_id: tenantId // Ensure tenant can only access their own dialplans
      },
      include: {
        pbx_dialplan_details: {
          where: { enabled: 'true' },
          orderBy: [
            { group: 'asc' },
            { sequence: 'asc' }
          ]
        },
        pbx_domains: true
      }
    });

    return dialplan as Dialplans | null;
  } catch (error) {
    console.error(`Error fetching dialplan ${id}:`, error);
    throw new DatabaseError(`Failed to fetch dialplan ${id}`);
  }
}


/**
 * Get a specific default dialplan by ID
 */
export async function getDefaultDialplanById(
  id: string
): Promise<DialplanDefaults | null> {
  try {
    const dialplan = await prisma.pbx_dialplan_defaults.findUnique({
      where: { id }
    });

    return dialplan as DialplanDefaults | null;
  } catch (error) {
    console.error(`Error fetching default dialplan ${id}:`, error);
    throw new DatabaseError(`Failed to fetch default dialplan ${id}`);
  }
}

/**
 * Get combined dialplans (both domain-specific and defaults) for a tenant
 */
export async function getAllDialplans({
  uid,
  skip = 0,
  take = 50,
  searchTerm
}: Omit<GetDialplansOptions, 'enabled'>): Promise<{
  domainDialplans: DialplanXmlDisplay[];
  defaultDialplans: DialplanDefaultXmlDisplay[];
  total: number;
}> {
  try {
    const [domainResults, defaultResults] = await Promise.all([
      getDomainDialplans({ uid, skip, take, searchTerm }),
      getDefaultDialplans({ skip, take, searchTerm })
    ]);

    return {
      domainDialplans: domainResults.dialplans,
      defaultDialplans: defaultResults.dialplans,
      total: domainResults.total + defaultResults.total
    };
  } catch (error) {
    console.error('Error fetching all dialplans:', error);
    throw new DatabaseError('Failed to fetch all dialplans');
  }
}