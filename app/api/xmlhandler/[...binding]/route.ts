import { NextRequest, NextResponse } from 'next/server'
import { create } from 'xmlbuilder2'
import { prisma } from '@/lib/prisma'
import { getDirectoryExtension } from '@/lib/db/q'
import { getDialplanByContext, getSystemVariables } from '@/lib/db/dialplan'
import { logToFreeswitchConsole } from '@/lib/switchLogger'
import { validate as isValidUUID } from 'uuid'

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

interface DialplanDestinationType {
  type: 'destination_number' | 'sip_to_user' | 'sip_req_user';
  value: string;
}

async function checkRegistrationStatus(user: string, domain: string, profile: string ): Promise<{ isRegistered: boolean, contact?: string }> {
  try {
    await logToFreeswitchConsole('INFO', `Checking registration status for ${user}@${domain}`);

    const realtimeVgtUrl = process.env.REALTIME_VGT_URL || 'http://localhost:8081';
    
    const response = await fetch(`${realtimeVgtUrl}/registrations/sofia-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        extension: user,
        domain: domain,
        profile: profile
      })
    });
    
    if (!response.ok) {
      await logToFreeswitchConsole('WARNING', 
        `Failed to check registration status for ${user}@${domain}${profile ? ` on ${profile}` : ''}: ${response.statusText}`
      );
      return { isRegistered: false };
    }

    const data = await response.json();
    // Check if registration exists and is active
    if (data.success && 
        data.registrations && 
        data.registrations.status === 'Registered' && 
        data.registrations.contact && 
        data.registrations.contact.indexOf('error/user_not_registered') === -1) {
      
      await logToFreeswitchConsole('INFO', 
        `Found registration for ${user}@${domain}${profile ? ` on ${profile}` : ''}`
      );
      return { 
        isRegistered: true, 
        contact: data.registrations.contact 
      };
    }
    
    await logToFreeswitchConsole('INFO', 
      `No valid registration found for ${user}@${domain}${profile ? ` on ${profile}` : ''}`
    );
    return { isRegistered: false };
  } catch (error) {
    await logToFreeswitchConsole('ERROR', 
      `Error checking registration status for ${user}@${domain}: ${error}`
    );
    return { isRegistered: false };
  }
}


async function handleDirectory(formData: FormData) {
  const purpose = formData.get('purpose') as string;
  const action = formData.get('action') as string;
  const type = formData.get('type') as string;
  const key = formData.get('key') as string;
  const domainKeyValue = formData.get('key_value') as string;
  const profileName = formData.get('sip_profile') as string;
  const profileNameFromCurlPool = formData.get('curl_pool_original_profile') as string; 
  const sip_auth_method = formData.get('sip_auth_method') as string;
  const from_user = formData.get('from_user') as string;
  const user = formData.get('user') as string;
  const domain = formData.get('domain') as string;
  const event_calling_function = formData.get('Event-Calling-Function') as string;
  const event_calling_file = formData.get('Event-Calling-File') as string;
  const dialed_extension = formData.get('dialed_extension') as string;
  const as_channel = formData.get('as_channel') as string;



  if (purpose === 'network-list' || purpose === 'gateways') {
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  if (!user || !domain) {
    await logToFreeswitchConsole('INFO', `XML Directory: Missing user or domain for standard directory lookup.`);
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  if (user === '*97' || user === '') {
    return new NextResponse(directoryNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  try {
    // Fetch extension data once
    const extension = await getDirectoryExtension(user, domain);
    if (!extension) {
      await logToFreeswitchConsole('INFO', 
        `Extension not found for ${user}@${domain}`
      );
      return new NextResponse(directoryNotFoundXml, {
         headers: { 'Content-Type': 'text/xml' } 
        });
    }

    // Special handling for user_data_function from dialplan
    if (event_calling_function === 'user_data_function' && type === 'var' && key) {      
      let value: string | undefined;

      // Map the requested key to extension properties
      switch(key) {
        case 'id':
        case 'extension_uuid':
          value = extension.id;
          break;
        case 'user_context':
          value = extension.user_context || domain;
          break;
        // Handle boolean fields
        case 'forward_all_enabled':
        case 'forward_busy_enabled':
        case 'forward_no_answer_enabled':
        case 'forward_user_not_registered_enabled':
        case 'follow_me_enabled':
        case 'do_not_disturb':
        case 'call_screen_enabled':
        case 'directory_visible':
        case 'directory_exten_visible':
          value = extension[key] === true ? 'true' : 'false';
          break;
        case 'call_timeout':
          value = extension[key]?.toString() || '30';
          break;
        // Handle forwarding destinations
        case 'forward_all_destination':
        case 'forward_busy_destination':
        case 'forward_no_answer_destination':
        case 'forward_user_not_registered_destination':
          value = extension[key] || '';
          break;
        // Handle caller ID fields
        case 'effective_caller_id_name':
        case 'effective_caller_id_number':
        case 'outbound_caller_id_name':
        case 'outbound_caller_id_number':
        case 'emergency_caller_id_name':
        case 'emergency_caller_id_number':
          value = extension[key] || '';
          break;
        // Handle other standard fields
        case 'toll_allow':
        case 'accountcode':
        case 'user_record':
        case 'hold_music':
        case 'limit_max':
        case 'limit_destination':
        case 'call_group':
          value = extension[key] || '';
          break;
        default:
          value = extension[key as keyof typeof extension]?.toString() || '';
      }

      const safeValue = value === null || value === undefined ? '' : String(value);
      const varXml = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
        .ele('document', { type: 'freeswitch/xml' })
          .ele('section', { name: 'directory' })
            .ele('domain', { name: domain })
              .ele('user', { id: user })
                .ele('variables')
                  .ele('variable', { name: key, value: safeValue });

      const finalXml = varXml.end({ prettyPrint: true });
      await logToFreeswitchConsole('INFO', `Directory var lookup result: ${key}=${safeValue} for ${user}@${domain}`);
      return new NextResponse(finalXml, {         headers: { 'Content-Type': 'text/xml' }       });
    }

    // Handle user_outgoing_channel for call setup
    if (event_calling_function === 'user_outgoing_channel' && action === 'user_call') {
      // Check if user is registered in FreeSWITCH's registration table
      const registrationStatus = await checkRegistrationStatus(user, domain, profileNameFromCurlPool);
      
      if (!registrationStatus.isRegistered) {
        if (extension.forward_user_not_registered_enabled === 'true' && extension.forward_user_not_registered_destination) {
          const dialString = `error/user_not_registered`;
          // Build XML with forward destination
          const xml = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
            .ele('document', { type: 'freeswitch/xml' })
              .ele('section', { name: 'directory' })
                .ele('domain', { name: domain })
                  .ele('user', { id: user })
                    .ele('variables')
                      .ele('variable', { name: 'forward_user_not_registered_enabled', value: 'true' })
                      .ele('variable', { name: 'forward_user_not_registered_destination', value: extension.forward_user_not_registered_destination });

          const finalXml = xml.end({ prettyPrint: true });
          console.log('user_outgoing_channel XML:', finalXml)
          await logToFreeswitchConsole('INFO', 
            `User ${user}@${domain} not registered, forwarding to ${extension.forward_user_not_registered_destination}`
          );
          return new NextResponse(finalXml, {
             headers: { 'Content-Type': 'text/xml' } 
            });
        } else {
          // If no forwarding is configured, return not found
          return new NextResponse(directoryNotFoundXml, { 
            headers: { 'Content-Type': 'text/xml' } 
          });
        }
      }

      // User is registered, proceed with normal directory XML generation
      const presenceId = `${user}@${domain}`;
      let dialString = "";
      
      if (extension.do_not_disturb === "true") {
        dialString = "error/user_busy";
      } else {
        // Use the actual contact information if available
        if (registrationStatus.contact) {
          dialString = `{sip_invite_domain=${domain},presence_id=${presenceId}}${registrationStatus.contact}`;
        } else {
          // Fallback to the extension's dial string or default
          dialString = `{sip_invite_domain=${domain},presence_id=${presenceId}}${extension.dial_string || '${sofia_contact(*/${user}@${domain})}'}`;
        }
      }

      // Generate directory XML with appropriate dial string
      const xml = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
        .ele('document', { type: 'freeswitch/xml' })
          .ele('section', { name: 'directory' })
            .ele('domain', { name: domain })
              .ele('user', { id: user })
                .ele('params')
                  .ele('param', { name: 'dial-string', value: dialString });

      const finalXml = xml.end({ prettyPrint: true });
      await logToFreeswitchConsole('INFO', 
        `Generated directory XML for registered user ${user}@${domain}`
      );
      return new NextResponse(finalXml, { 
        headers: { 'Content-Type': 'text/xml' } 
      });
    }

    // Regular directory lookup for registration, auth, etc.
    const userContext = extension.user_context || domain;
    const presenceId = `${user}@${domain}`;

    let dialString = "";
    if (extension.do_not_disturb === "true") {
      dialString = "error/user_busy";
    } else if (extension.dialstring) {
      dialString = extension.dialstring;
    } else {
      // Don't check registration for non-call scenarios
      // Use the standard dial string format
      dialString = `{sip_invite_domain=${domain},presence_id=${presenceId}}${extension.dial_string || '${sofia_contact(*/${user}@${domain})}'}`;
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

    return new NextResponse(directoryXml, { 
      headers: { 'Content-Type': 'text/xml' } 
    });

  } catch (error) {
    console.error('Error during directory lookup:', error);
    await logToFreeswitchConsole('ERROR', 
      `XML Directory: Error during lookup for '${user}@${domain}': ${error instanceof Error ? error.message : String(error)}`
    );
    
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
  const params = {
    callerContext: formData.get('Caller-Context') as string,
    huntContext: formData.get('Hunt-Context') as string,
    hostname: formData.get('FreeSWITCH-Hostname') as string,
    profileName: formData.get('variable_sofia_profile_name') as string,
    sipToUser: formData.get('variable_sip_to_user') as string,
    sipReqUser: formData.get('variable_sip_req_user') as string,
    sipFromHost: formData.get('variable_sip_from_host') as string,
    callerDestNumber: formData.get('Caller-Destination-Number') as string,
    userContext: formData.get('variable_user_context') as string,
    domainUuid: formData.get('domain_uuid') as string,
    domainName: formData.get('domain_name') as string || formData.get('variable_domain_name') as string,
    callerId: formData.get('Caller-Caller-ID-Number') as string
  };



  const effectiveContext = params.huntContext || params.callerContext;

  if (!effectiveContext || !params.hostname) {
    await logToFreeswitchConsole('WARNING', 
      `XML Dialplan: Request missing essential parameters. Data: ${JSON.stringify(Object.fromEntries(formData))}`
    );
    return new NextResponse(genericNotFoundXml, { headers: { 'Content-Type': 'text/xml' } });
  }

  const destinationNumber = (() => {
    const dialplanDestination: DialplanDestinationType = {
      type: 'destination_number',
      value: 'destination_number'
    };
    
    if (dialplanDestination.type === 'sip_to_user' && params.sipToUser) {
      return decodeURIComponent(params.sipToUser);
    }
    if (dialplanDestination.type === 'sip_req_user' && params.sipReqUser) {
      return decodeURIComponent(params.sipReqUser);
    }
    return params.sipReqUser || params.sipToUser || params.callerDestNumber || '';
  })();

  try {
    await logToFreeswitchConsole('INFO', 
      `XML Dialplan Debug:
      Context: ${effectiveContext}
      Destination Number: ${destinationNumber}
      Hostname: ${params.hostname}
      Domain Name: ${params.domainName}
      From Host: ${params.sipFromHost}`
    );

    const [systemVars, dialplanEntries] = await Promise.all([
      getSystemVariables(),
      getDialplanByContext({
        callerContext: effectiveContext,
        hostname: params.hostname,
        destinationNumber,
        sipFromHost: params.sipFromHost,
      })
    ]);

    if (!dialplanEntries.length) {
      return new NextResponse(genericNotFoundXml, { 
        headers: { 'Content-Type': 'text/xml' }
       });
    }

    const docBuilder = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
      .ele('document', { type: 'freeswitch/xml' });

    const sectionBuilder = docBuilder.ele('section', { 
      name: 'dialplan', 
      description: `Dialplan for ${effectiveContext}` 
    });

    const contextBuilder = sectionBuilder.ele('context', {
      name: effectiveContext,
    });

    contextBuilder
    .ele('extension', { name: "domain_setup", continue: "true" })
      .ele('condition', { field: "${domain_name}", expression: "", break: "never" })
      .ele('action', { 
        application: "set",
        data: `domain_name=${params.sipFromHost || effectiveContext}`,
        inline: "true"
      }).up()
      .ele('action', { 
        application: "set",
        data: `destination_number=${destinationNumber}`,
        inline: "true"
      }).up()
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
          contextBuilder.com(` Failed to import dialplan entry: ${parseError} `);
        }
      } else {
        console.log('WARNING', `XML Dialplan: Rule sequence ${entry.sequence} has no XML content.`);
      }
    });

    const finalXml = docBuilder.end({ prettyPrint: true });
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

      const sofiaConfig = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
        .ele('document', { type: 'freeswitch/xml' })
          .ele('section', { name: 'configuration' })
            .ele('configuration', { name: 'sofia.conf', description: 'sofia Endpoint' })
              .ele('global_settings')
                .ele('param', { name: 'log-level', value: '0' }).up()
                .ele('param', { name: 'debug-presence', value: '0' }).up()
              .up()
              .ele('profiles');

      for (const profile of sipProfiles) {
        const profileElem = sofiaConfig.ele('profile', { name: profile.name });
        
        profileElem.ele('aliases').up();

        const gatewaysElem = profileElem.ele('gateways');
        gatewaysElem.ele('X-PRE-PROCESS', { 
          cmd: 'include', 
          data: `sip_profiles/${profile.name}/*.xml` 
        }).up();
        gatewaysElem.up();

        const domainsElem = profileElem.ele('domains');
        for (const domain of profile.pbx_sip_profile_domains) {
          domainsElem.ele('domain', {
            name: domain.name,
            alias: domain.alias,
            parse: domain.parse
          }).up();
        }
        domainsElem.up();

        const settingsElem = profileElem.ele('settings');
        for (const setting of profile.pbx_sip_profile_settings) {
          settingsElem.ele('param', {
            name: setting.name,
            value: setting.value || ''
          }).up();
        }
        settingsElem.up();

        profileElem.up();
      }

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
  const lang = formData.get('lang') as string;
  const macro_name = formData.get('macro_name') as string;
  const sipFromHost = formData.get('sip_from_host') as string;

  if (!lang || !macro_name) {
    return new NextResponse(genericNotFoundXml, { 
      headers: { 'Content-Type': 'text/xml' } 
    });
  }


  const sounds_dir = '/usr/share/freeswitch/sounds'
  const tts_engine = 'cepstral'
  const tts_voice = 'callie'
  const sound_dialect = 'us'

  const sound_prefix_val = `${sounds_dir}/${lang}/${sound_dialect}/${tts_voice}`;
  const say_module_val = lang

  console.log(sound_prefix_val);

  let phraseDetailsFromDb: Array<{ pfunction: string; data: string }> = [];

  try {
    if (isValidUUID(macro_name)) {
      const phraseWithDetails = await prisma.pbx_phrases.findFirst({
        where: {
          id: macro_name, 
          domain_uuid: sipFromHost,
          language: lang,
          enabled: 'true',
        },
        include: {
          pbx_phrase_details: { 
            orderBy: {
              sequence: 'asc',
            },
          },
        },
      });
      
      if (phraseWithDetails?.pbx_phrase_details) {
        phraseDetailsFromDb = phraseWithDetails.pbx_phrase_details.map(detail => ({
          pfunction: detail.pfunction,
          data: detail.data || '',
        }));
      }
    }

    const root = create({ version: '1.0', encoding: 'UTF-8', standalone: 'no' })
    .ele('document', { type: 'freeswitch/xml' });

    const section = root.ele('section', { name: 'languages' });
    const languageNode = section.ele('language', {
      name: lang,
      'say-module': say_module_val,
      'sound-prefix': sound_prefix_val,
      'tts-engine': tts_engine,
      'tts-voice': tts_voice,
    });

    const macrosNode = languageNode.ele('phrases').ele('macros'); 
    const macroNode = macrosNode.ele('macro', { name: macro_name }); 
    const inputNode = macroNode.ele('input', { pattern: '(.*)' });
    const matchNode = inputNode.ele('match');

    for (const detail of phraseDetailsFromDb) {
      matchNode.ele('action', { function: detail.pfunction, data: detail.data });
    }

    const languagesXml = root.end({ prettyPrint: true });
    console.log('Generated XML for languages:', languagesXml);
    await logToFreeswitchConsole('INFO', `XML Languages: Successfully generated XML for lang='${lang}', macro_name='${macro_name}'.`);
    return new NextResponse(languagesXml, {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logToFreeswitchConsole('ERROR', `XML Languages: Error processing lang='${lang}', macro_name='${macro_name}': ${errorMessage}`);
    console.error(`Error in handleLanguages for ${lang} / ${macro_name}:`, error);
    return new NextResponse(genericNotFoundXml, { 
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
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
    return new NextResponse(errorXml, { 
      status: 500, 
      headers: { 'Content-Type': 'text/xml' } 
    });
  }
}