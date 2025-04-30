import { NextRequest, NextResponse } from 'next/server'
import { create } from 'xmlbuilder2'
import { prisma } from '@/lib/prisma'
import { getTenantByDomain } from '@/lib/db/queries'
import { getDirectoryExtension, getDialplanByContext, getSystemVariables } from '@/lib/db/q'

const genericNotFoundXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="freeswitch/xml">
  <section name="result">
    <result status="not found" />
  </section>
</document>`;

const directoryNotFoundXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="freeswitch/xml">
  <section name="directory">
    <result status="not found"/>
  </section>
</document>`;

async function handleDirectory(formData: FormData) {
  const purpose = formData.get('purpose') as string;
  const domainKeyValue = formData.get('key_value') as string;
  const profileName = formData.get('profile') as string;

  if (purpose === 'network-list') {
    console.log(`Handling Directory Request for network-list purpose (key: ${domainKeyValue}) - returning structured not found.`);
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  } else if (purpose === 'gateways') {
    console.log(`Handling Directory Request for gateways purpose (profile: ${profileName}) - returning structured not found.`);
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  console.log('Handling Directory Request for user lookup:', Object.fromEntries(formData));
  const user = formData.get('user') as string;
  const domain = formData.get('domain') as string;

  if (!user || !domain) {
    console.log('Missing user or domain for standard directory lookup.');
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  try {
    const extension = await getDirectoryExtension(user, domain);

    if (!extension) {
      console.log(`Extension '${user}' not found in domain '${domain}'`);
      return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
    }

    const directoryXmlBuilder = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
      .ele('document', { type: 'freeswitch/xml' })
        .ele('section', { name: 'directory' })
          .ele('domain', { name: domain })
            .ele('groups')
              .ele('group', { name: 'default' })
                .ele('users')
                  .ele('user', { id: user });

    // Add parameters
    const params = directoryXmlBuilder.ele('params');
    
    // Add essential parameters
    params.ele('param', { name: 'password', value: extension.password });
    
    // Add optional parameters if they exist
    if (extension.accountcode) {
      params.ele('param', { name: 'accountcode', value: extension.accountcode });
    }
    if (extension.toll_allow) {
      params.ele('param', { name: 'toll_allow', value: extension.toll_allow });
    }
    if (extension.user_record) {
      params.ele('param', { name: 'user_record', value: extension.user_record });
    }

    params.up();

    // Add variables
    const variables = directoryXmlBuilder.ele('variables');

    // Add user context
    variables.ele('variable', { 
      name: 'user_context', 
      value: extension.user_context || domain 
    });

    // Add caller ID information
    if (extension.effective_caller_id_name) {
      variables.ele('variable', { 
        name: 'effective_caller_id_name', 
        value: extension.effective_caller_id_name 
      });
    }
    if (extension.effective_caller_id_number) {
      variables.ele('variable', { 
        name: 'effective_caller_id_number', 
        value: extension.effective_caller_id_number 
      });
    }
    if (extension.outbound_caller_id_name) {
      variables.ele('variable', { 
        name: 'outbound_caller_id_name', 
        value: extension.outbound_caller_id_name 
      });
    }
    if (extension.outbound_caller_id_number) {
      variables.ele('variable', { 
        name: 'outbound_caller_id_number', 
        value: extension.outbound_caller_id_number 
      });
    }
    if (extension.call_group) {
      variables.ele('variable', { 
        name: 'call_group', 
        value: extension.call_group 
      });
    }
    if (extension.call_timeout) {
      variables.ele('variable', { 
        name: 'call_timeout', 
        value: extension.call_timeout.toString() 
      });
    }

    variables.up();

    const directoryXml = directoryXmlBuilder.up().up().up().up().up().up().end({ prettyPrint: true });

    return new NextResponse(directoryXml, { headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error('Error during directory lookup:', error);
    const errorXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><document type="freeswitch/xml"><section name="result"><result status="error" data="Server error during directory lookup" /></section></document>`;
    return new NextResponse(errorXml, { status: 500, headers: { 'Content-Type': 'text/xml' } });
  }
}

async function handleDialplan(formData: FormData) {
  const callerContext = formData.get('Caller-Context') as string;
  const hostname = formData.get('FreeSWITCH-Hostname') as string;
  const destinationNumber = formData.get('destination_number') as string;

  if (!callerContext || !hostname) {
    return new NextResponse(genericNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  // Determine context name and cache key
  let callContext = callerContext || 'public';
  let contextName = callContext;
  
  if (callContext === 'public' || callContext.startsWith('public@') || callContext.endsWith('.public')) {
    contextName = 'public';
  }

  // Set up cache key
  const contextType = process.env.PBX_XMLH_CONTEXT_TYPE as 'single' | 'multi' || 'multi';
  const dialplanCacheKey = contextName === 'public' && contextType === 'single' 
    ? `dialplan:${contextName}:${destinationNumber}` 
    : `dialplan:${callContext}`;

  try {

    // Start building XML
    const dialplanBuilder = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
      .ele('document', { type: 'freeswitch/xml' })
        .ele('section', { name: 'dialplan', description: callContext });

    // Add system variables
    const systemVars = await getSystemVariables();
    for (const { name, value } of systemVars) {
      dialplanBuilder.ele('variable', { name, value });
    }

    // Get dialplan entries
    const dialplanEntries = await getDialplanByContext({
      callerContext: callContext,
      hostname,
      destinationNumber,
      contextType
    });

    if (!dialplanEntries.length) {
      return new NextResponse(genericNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
    }

    // Add each dialplan entry's XML
    for (const entry of dialplanEntries) {
      if (entry.xml) {
        dialplanBuilder.raw(entry.xml);
      }
    }

    // Finalize XML
    const finalXml = dialplanBuilder.end({ prettyPrint: true });
    

    return new NextResponse(finalXml, { headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error('Error generating dialplan:', error);
    return new NextResponse(genericNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }
}

async function handleConfiguration(formData: FormData) {
  const section = formData.get('section') as string;
  const tagName = formData.get('tag_name') as string;
  const keyName = formData.get('key_name') as string;
  const keyValue = formData.get('key_value') as string;

  if (section === 'configuration' && tagName === 'configuration' && keyName === 'name' && keyValue === 'acl.conf') {
    try {
      const acls = await prisma.pbx_access_controls.findMany({ 
        include: { 
          pbx_access_control_nodes: true,
        }, 
      });

      const aclConfig = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
        .ele('document', { type: 'freeswitch/xml' })
          .ele('section', { name: 'configuration' })
            .ele('configuration', { name: 'acl.conf', description: 'Network Lists' })
              .ele('network-lists');
      for (const acl of acls) {
        const list = aclConfig.ele('list', { name: acl.name, default: acl.default });
        for (const node of acl.pbx_access_control_nodes) {
          const nodeAttrs: { type: string; cidr?: string; domain?: string } = { type: node.type };
          if (node.cidr) nodeAttrs.cidr = node.cidr;
          else if (node.domain) nodeAttrs.domain = node.domain;
          list.ele('node', nodeAttrs);
        }
        list.up();
      }
      const configXml = aclConfig.up().up().up().up().end({ prettyPrint: true });

      console.log('Generated acl.conf.xml:', configXml);
      return new NextResponse(configXml, { headers: { 'Content-Type': 'text/xml' } });
    } catch (dbError) {
      console.error('Database error fetching ACLs:', dbError);
      const errorXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><document type="freeswitch/xml"><section name="result"><result status="error" data="Database error fetching ACL configuration" /></section></document>`;
      return new NextResponse(errorXml, { status: 500, headers: { 'Content-Type': 'text/xml' } });
    }
  }
  
  else if (section === 'configuration' && tagName === 'configuration' && keyName === 'name' && keyValue === 'sofia.conf') {
    try {
      // Fetch SIP profiles and their associated domains and settings
      const sipProfiles = await prisma.pbx_sip_profiles.findMany({
        where: {
          disabled: false,
        },
        include: {
          pbx_sip_profile_domains: {
            orderBy: {
              name: 'asc'
            }
          },
          pbx_sip_profile_settings: {
            where: {
              disabled: false
            },
            orderBy: {
              name: 'asc'
            }
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Start building the sofia.conf XML
      const sofiaConfig = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
        .ele('document', { type: 'freeswitch/xml' })
          .ele('section', { name: 'configuration' })
            .ele('configuration', { name: 'sofia.conf', description: 'sofia Endpoint' })
              .ele('global_settings')
                .ele('param', { name: 'log-level', value: '0' }).up()
                .ele('param', { name: 'debug-presence', value: '0' }).up()
              .up()
              .ele('profiles');

      // Add each profile
      for (const profile of sipProfiles) {
        const profileElem = sofiaConfig.ele('profile', { name: profile.name });
        
        // Add aliases section (empty like in Django)
        profileElem.ele('aliases').up();

        // Add gateways section with just the include directive
        const gatewaysElem = profileElem.ele('gateways');
        gatewaysElem.ele('X-PRE-PROCESS', { 
          cmd: 'include', 
          data: `sip_profiles/${profile.name}/*.xml` 
        }).up();
        gatewaysElem.up();

        // Add domains section
        const domainsElem = profileElem.ele('domains');
        for (const domain of profile.pbx_sip_profile_domains) {
          domainsElem.ele('domain', {
            name: domain.name,
            alias: domain.alias,
            parse: domain.parse
          }).up();
        }
        domainsElem.up();

        // Add settings section
        const settingsElem = profileElem.ele('settings');
        for (const setting of profile.pbx_sip_profile_settings) {
          settingsElem.ele('param', {
            name: setting.name,
            value: setting.value || ''  // Handle null value
          }).up();
        }
        settingsElem.up();

        profileElem.up();
      }

      // Finalize and return the XML
      const configXml = sofiaConfig.end({ prettyPrint: true });
      console.log('Generated sofia.conf:', configXml);
      return new NextResponse(configXml, { headers: { 'Content-Type': 'text/xml' } });

    } catch (dbError) {
      console.error('Database error fetching SIP Profiles:', dbError);
      const errorXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><document type="freeswitch/xml"><section name="result"><result status="error" data="Database error fetching sofia configuration" /></section></document>`;
      return new NextResponse(errorXml, { status: 500, headers: { 'Content-Type': 'text/xml' } });
    }
  }



  const configXml = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
    .ele('document', { type: 'freeswitch/xml' })
      .ele('section', { name: 'configuration' })
        .ele('configuration', { name: keyName, description: 'Example Configuration' })
          .ele('settings')
            .ele('param', { name: 'example_param', value: 'example_value' }).up()
          .up()
        .up()
      .up()
    .end({ prettyPrint: true });

  return new NextResponse(configXml, { headers: { 'Content-Type': 'text/xml' } });
}

async function handleLanguages(formData: FormData) {
  const language = formData.get('language') as string;

  if (!language) {
    return new NextResponse(genericNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  const languagesXml = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
    .ele('document', { type: 'freeswitch/xml' })
      .ele('section', { name: 'languages' })
        .ele('language', { name: language })
          .ele('phrases')
            .ele('phrase', { name: 'example_phrase' })
              .ele('macros')
                .ele('macro', { name: 'example_macro' })
                  .ele('tag', { name: 'example_tag', value: 'example_value' }).up()
                .up()
              .up()
            .up()
          .up()
        .up()
      .up()
    .end({ prettyPrint: true });

  return new NextResponse(languagesXml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function POST(
  request: NextRequest, 
  { params }: { params: { binding: string[] } }
) {
  const binding = (await params).binding[0];
  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error('Failed to parse form data:', error);
    return new NextResponse('Bad Request: Could not parse form data', { status: 400 });
  }

  console.log(`Received XML Handler request for binding: ${binding}`);
  console.log('Form Data:', Object.fromEntries(formData));

  try {
    switch (binding) {
      case 'directory':
        return await handleDirectory(formData);
      case 'dialplan':
        return await handleDialplan(formData);
      case 'configuration':
        return await handleConfiguration(formData);
      case 'languages':
        return await handleLanguages(formData);
      default:
        console.warn(`Unsupported binding: ${binding}`);
        return new NextResponse(genericNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
    }
  } catch (error) {
    console.error(`Error handling binding ${binding}:`, error);
    const errorXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><document type="freeswitch/xml"><section name="result"><result status="error" data="Server error processing request" /></section></document>`;
    return new NextResponse(errorXml, { status: 500, headers: { 'Content-Type': 'text/xml' } });
  }
}