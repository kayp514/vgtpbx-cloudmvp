import { NextRequest, NextResponse } from 'next/server'
import { create } from 'xmlbuilder2'
import { prisma } from '@/lib/prisma'
import { getDirectoryExtension } from '@/lib/db/q'
import { getDialplanByContext, getSystemVariables } from '@/lib/db/dialplan'
import { logToFreeswitchConsole } from '@/lib/switchLogger'

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
  const type = formData.get('type') as string;
  const key = formData.get('key') as string;
  const domainKeyValue = formData.get('key_value') as string;
  const profileName = formData.get('profile') as string;
  const sip_auth_method = formData.get('sip_auth_method') as string;
  const from_user = formData.get('from_user') as string;

  if (purpose === 'network-list') {
   // console.log(`Handling Directory Request for network-list purpose (key: ${domainKeyValue}) - returning structured not found.`);
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }
  
  if (purpose === 'gateways') {
   // console.log(`Handling Directory Request for gateways purpose (profile: ${profileName}) - returning structured not found.`);
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  //console.log('Handling Directory Request for user lookup:', Object.fromEntries(formData));
  const user = formData.get('user') as string;
  const domain = formData.get('domain') as string;

  if (!user || !domain) {
    console.log('Missing user or domain for standard directory lookup.');
    await logToFreeswitchConsole('INFO', `XML Directory: Missing user or domain for standard directory lookup.`);
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  if (user === '*97' || user === '') {
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  try {
    if (type === 'var' && key) {
      const user = formData.get('user') as string;
      const domain = formData.get('domain') as string;
  
      await logToFreeswitchConsole('INFO', `Directory var lookup: user=${user}, domain=${domain}, key=${key}`);
  
      const extension = await getDirectoryExtension(user, domain);
      if (!extension) {
        await logToFreeswitchConsole('INFO', `Directory var lookup: Extension not found for ${user}@${domain}`);
        return new NextResponse(directoryNotFoundXml, { 
          headers: { 'Content-Type': 'text/xml' } 
        });
      }
  
      // Map FreeSWITCH expected variables to extension properties
      const variableMap: Record<string, string | undefined> = {
        'id': extension.id,
        'extension_uuid': extension.id,
        'user_context': extension.user_context || domain,
        'effective_caller_id_name': extension.effective_caller_id_name,
        'effective_caller_id_number': extension.effective_caller_id_number,
        'outbound_caller_id_name': extension.outbound_caller_id_name,
        'outbound_caller_id_number': extension.outbound_caller_id_number,
        'emergency_caller_id_name': extension.emergency_caller_id_name,
        'emergency_caller_id_number': extension.emergency_caller_id_number,
        'directory_visible': extension.directory_visible,
        'directory_exten_visible': extension.directory_exten_visible,
        'limit_max': extension.limit_max,
        'limit_destination': extension.limit_destination,
        'call_group': extension.call_group,
        'call_screen_enabled': extension.call_screen_enabled,
        'hold_music': extension.hold_music,
        'toll_allow': extension.toll_allow,
        'accountcode': extension.accountcode,
        'user_record': extension.user_record,
        'forward_all_enabled': extension.forward_all_enabled,
        'forward_all_destination': extension.forward_all_destination,
        'forward_busy_enabled': extension.forward_busy_enabled,
        'forward_busy_destination': extension.forward_busy_destination,
        'forward_no_answer_enabled': extension.forward_no_answer_enabled,
        'forward_no_answer_destination': extension.forward_no_answer_destination,
        'forward_user_not_registered_enabled': extension.forward_user_not_registered_enabled,
        'forward_user_not_registered_destination': extension.forward_user_not_registered_destination,
        'do_not_disturb': extension.do_not_disturb,
        'call_timeout': extension.call_timeout?.toString(),
        'domain_name': domain,
        'domain_uuid': extension.domain_uuid
      };
  
      const requestedValue = variableMap[key];
      const safeValue = (requestedValue === undefined || requestedValue === null) ? '' : String(requestedValue); 
      await logToFreeswitchConsole('INFO', `Directory var lookup result: ${key}=${safeValue} for ${user}@${domain}`);
  
      const varXml = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
      .ele('document', { type: 'freeswitch/xml' })
        .ele('section', { name: 'directory' })
          .ele('domain', { name: domain })
            .ele('user', { id: user })
              .ele('variables')
                .ele('variable', {
                   name: key, 
                   value: safeValue 
                  });
  
    


    
    const finalXml = varXml.end({ prettyPrint: true });
    console.log('Generated directory var XML:', finalXml);
      await logToFreeswitchConsole('INFO', `Generated directory var XML for ${user}@${domain}`);
  
      return new NextResponse(finalXml, { 
        headers: { 'Content-Type': 'text/xml' } 
      });
  }
    const extension = await getDirectoryExtension(user, domain);

    if (!extension) {
      console.log(`Extension '${user}' not found in domain '${domain}'`);
      await logToFreeswitchConsole('INFO', `XML Directory: Extension '${user}' not found in domain '${domain}'`);
      return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
    }

    const userContext = extension.user_context || domain
    const presenceId = `${user}@${domain}`

    let dialString = ""
    if (extension.do_not_disturb === "true") {
      dialString = "error/user_busy";
    } else if (extension.dialstring) {
      dialString = extension.dialstring
    } else {
      dialString = `{sip_invite_domain=${domain},presence_id=${presenceId}}${extension.dial_string || '${sofia_contact(*/${user}@${domain})}'}`
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

    switch (sip_auth_method) {
      case 'REGISTER':
        params.ele('param', { name: 'password', value: extension.password });

        if (extension.extension_type === 'virtual') {
          params.ele('param', { name: 'auth-acl', value: `virtual.${extension.id}` });
        }
        break;
      case 'INVITE':
        const presenceId = `${user}@${domain}`;
        let dialString = "";

        if (extension.do_not_disturb === "true") {
          dialString = "error/user_busy";
        } else if (extension.dialstring) {
          dialString = extension.dialstring;
        } else {
          dialString = `{sip_invite_domain=${domain},presence_id=${presenceId}}${extension.dial_string || '${sofia_contact(*/${user}@${domain})}'}`
        }
        params.ele('param', { name: 'dial-string', value: dialString });
        break;

      default:
        params.ele('param', { name: 'password', value: extension.password });
        params.ele('param', { name: 'dial-string', value: `{sip_invite_domain=${domain}}${extension.dial_string || '${sofia_contact(*/${user}@${domain})}'}`});
    }
    
    // Add essential parameters
    params.ele('param', { name: 'jsonrpc-allowed-methods', value: 'verto' });
    
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
    if (extension.mwi_account) {
      params.ele('param', { name: 'MWI-Account', value: extension.mwi_account });
    }

    params.up();

    // Add variables
    const variables = directoryXmlBuilder.ele('variables');

    const coreVariables = {
      'user_context': extension.user_context || domain,
      'domain_name': domain,
      'domain_uuid': extension.domain_uuid,
      'extension_uuid': extension.id,
      'call_timeout': extension.call_timeout?.toString() || '30',
      'caller_id_name': user,
      'caller_id_number': user,
      'presence_id': `${user}@${domain}`
    };

    Object.entries(coreVariables).forEach(([name, value]) => {
      variables.ele('variable', { name, value });
    });

    const conditionalVariables = {
      'effective_caller_id_name': extension.effective_caller_id_name,
      'effective_caller_id_number': extension.effective_caller_id_number,
      'outbound_caller_id_name': extension.outbound_caller_id_name,
      'outbound_caller_id_number': extension.outbound_caller_id_number,
      'emergency_caller_id_name': extension.emergency_caller_id_name,
      'emergency_caller_id_number': extension.emergency_caller_id_number,
      'directory-visible': extension.directory_visible,
      'directory-exten-visible': extension.directory_exten_visible,
      'limit_max': extension.limit_max,
      'limit_destination': extension.limit_destination,
      'call_group': extension.call_group,
      'call_screen_enabled': extension.call_screen_enabled,
      'hold_music': extension.hold_music,
      'toll_allow': extension.toll_allow,
      'accountcode': extension.accountcode
    };


    for (const [name, value] of Object.entries(conditionalVariables)) {
      if (value !== undefined && value !== null && value !== '') {
        variables.ele('variable', { name, value: value.toString() });
      }
    }

    // Add forward settings
    if (extension.forward_all_enabled === 'true') {
      variables.ele('variable', { name: 'forward_all_enabled', value: 'true' });
      variables.ele('variable', { name: 'forward_all_destination', value: extension.forward_all_destination });
    }

    if (extension.forward_busy_enabled === 'true') {
      variables.ele('variable', { name: 'forward_busy_enabled', value: 'true' });
      variables.ele('variable', { name: 'forward_busy_destination', value: extension.forward_busy_destination });
    }

    if (extension.forward_no_answer_enabled === 'true') {
      variables.ele('variable', { name: 'forward_no_answer_enabled', value: 'true' });
      variables.ele('variable', { name: 'forward_no_answer_destination', value: extension.forward_no_answer_destination });
    }

    // Add DND status
    if (extension.do_not_disturb === 'true') {
      variables.ele('variable', { name: 'do_not_disturb', value: 'true' });
    }


    variables.up();

    const directoryXml = directoryXmlBuilder.up().up().up().up().up().up().end({ prettyPrint: true });

    //console.log(directoryXml);

    //await logToFreeswitchConsole('INFO', `XML Directory: Generated XML '${directoryXml}' for user '${user}' in domain '${domain}'`);
    
    return new NextResponse(directoryXml, { headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error('Error during directory lookup:', error);
    await logToFreeswitchConsole('ERROR', `XML Directory: Error during lookup for '${user}@${domain}': ${error instanceof Error ? error.message : String(error)}`);
    
    const errorXml = 
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <document type="freeswitch/xml">
        <section name="result">
          <result status="error" data="Server error during directory lookup" />
        </section>
      </document>`;

    return new NextResponse(errorXml, { status: 500, headers: { 'Content-Type': 'text/xml' } });
  }
}


async function handleDialplan(formData: FormData) {
  const callerContext = formData.get('Caller-Context') as string;
  const hostname = formData.get('FreeSWITCH-Hostname') as string;
  const sipToUser = formData.get('variable_sip_to_user') as string;
  const sipReqUser = formData.get('variable_sip_req_user') as string;
  const sipFromHost = formData.get('variable_sip_from_host') as string;
  const domainNameVar = formData.get('domain_name') as string;

  const destinationNumber = sipToUser || sipReqUser || '';

  const effectiveContext = sipFromHost || domainNameVar || callerContext; 

  await logToFreeswitchConsole('INFO', `XML Dialplan Debug:
    sipToUser: ${sipToUser}
    sipReqUser: ${sipReqUser}
    sipFromHost: ${sipFromHost}
    callerContext: ${callerContext}
    effectiveContext: ${sipFromHost || callerContext}
  `);


  if (!callerContext || !hostname) {
    await logToFreeswitchConsole('WARNING', `XML Dialplan: Request missing Caller-Context or Hostname. Data: ${JSON.stringify(Object.fromEntries(formData))}`);
    return new NextResponse(genericNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  
  try {

    await logToFreeswitchConsole('INFO', `XML Dialplan: Request for context '${effectiveContext}', dest: '${destinationNumber || 'N/A'}', host: '${hostname}'`);

    const [systemVars, dialplanEntries] = await Promise.all([
      getSystemVariables(),
      getDialplanByContext({
        callerContext: callerContext, // Use the original context for fetching rules
        hostname,
        destinationNumber,
        sipFromHost // Pass sipFromHost for potential filtering/logic if needed
      })
    ]);

    await logToFreeswitchConsole('INFO', `Found ${dialplanEntries.length} dialplan entries`);
    //for (const entry of dialplanEntries) {
     // await logToFreeswitchConsole('INFO', `Dialplan entry: context=${entry.context}, sequence=${entry.sequence}`);
    //}

    if (!dialplanEntries.length) {
      //await logToFreeswitchConsole('INFO', `XML Dialplan: No matching dialplan rules or system variables found for context '${effectiveContext}'`);
      return new NextResponse(genericNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
    }

    const docBuilder = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
      .ele('document', { type: 'freeswitch/xml' });

    
    const sectionBuilder = docBuilder.ele('section', { 
      name: 'dialplan', 
      description: `Dialplan for ${effectiveContext}` 
    });

    const contextBuilder = sectionBuilder.ele('context', {
      name: callerContext,
    });


    contextBuilder
    .ele('extension', { name: "domain_setup", continue: "true" })
      .ele('condition', { field: "${domain_name}", expression: "", break: "never" })
        .ele('action', { 
          application: "set",
          data: `context=${effectiveContext}`,
          inline: "true"
        })
      .up()
      .ele('action', { 
        application: "set",
        data: `domain_name=${effectiveContext}`,
        inline: "true"
      })
      .up()
    .up()
  .up();


      systemVars.forEach(v => {
        const name = typeof v.name === 'string' ? v.name : '';
        const value = typeof v.value === 'string' ? v.value : '';
        if (name) {
            contextBuilder.ele('variable', { name, value });
        }
      });

      dialplanEntries.forEach(entry => {
        if (entry.xml) {
          try {
            const xmlFragment = create(entry.xml);
            contextBuilder.import(xmlFragment);
          } catch (parseError) {
            console.error("XML Dialplan: Failed to parse or import raw XML fragment:", parseError, "\nFragment:", entry.xml);
            //await logToFreeswitchConsole('ERROR', `XML Dialplan: Failed to parse/import XML fragment for rule ${entry.name || entry.id}. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            contextBuilder.com(` Failed to import dialplan entry: ${parseError} `);
          }
        } else {
          console.log('WARNING', `XML Dialplan: Rule sequence ${entry.sequence} has no XML content.`);
        }
      });

    const finalXml = docBuilder.end({ prettyPrint: true }); // Use prettyPrint: false for production
    console.log('Generated Dialplan XML:', finalXml);

    //await logToFreeswitchConsole('DEBUG', `XML Dialplan: Generated XML for context '${effectiveContext}':\n${finalXml}`);

    return new NextResponse(finalXml, { headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logToFreeswitchConsole('ERROR', `XML Dialplan: Error generating dialplan for context '${effectiveContext}': ${errorMessage}`);
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