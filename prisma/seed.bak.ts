import { PrismaClient } from '@prisma/client'
import { DOMAIN_DEFAULTS, TENANT_DEFAULTS } from '../lib/db/types'
import {
  defaultAccessControlNodes,
  defaultAccessControls,
  defaultSipProfilesFull
} from '../lib/db/switch-data'
import dialplanDefaultsData from '../lib/resources/pbx_dialplan_defaults.json'
import varsDefaultsData from '../lib/resources/pbx_vars.json'
import modulesDefaultsData from '../lib/resources/pbx_modules.json'
import defaultSettingsData from '../lib/resources/pbx_default_settings.json'

const prisma = new PrismaClient()

// Function to generate a 9-digit account ID
function generateAccountId(): string {
  // Generate a random 9-digit number and pad with zeros if needed
  const accountId = Math.floor(100000000 + Math.random() * 900000000).toString()
  return accountId
}

const accountId = generateAccountId()

async function seed() {
  try {
    // Create default tenant
    const defaultTenant = await prisma.auth_tenant.upsert({
      where: { accountId: accountId },
      update: {},
      create: {
        ...TENANT_DEFAULTS,
        accountId,
        name: 'default',
        domain: 'vogat.lifesprintcare.ca',
        description: 'Default tenant for system',
        plan: 'system',
        maxUsers: 1005,
        disabled: false
      },
    })

    const defaultDomain = await prisma.pbx_domains.upsert({
      where: { name: 'vogat.lifesprintcare.ca' },
      update: {},
      create: {
        ...DOMAIN_DEFAULTS,
        name: 'vogat.lifesprintcare.ca',
        description: 'Default system domain',
        tenantId: defaultTenant.id,
      }
    })

    const defaultAdmin = await prisma.auth_user.upsert({
      where: { email: 'admin@vogat.lifesprintcare.ca' },
      update: {},
      create: {
        uid: crypto.randomUUID(),
        email: 'admin@vogat.lifesprintcare.ca',
        displayName: 'System Admin',
        isSuperuser: true,
        isAdmin: true,
        isStaff: true,
        emailVerified: true,
        disabled: false,
        tenantId: defaultTenant.id,
        createdAt: new Date(),
        lastSignInAt: new Date(),
      }
    })

    const userMapping = await prisma.auth_user_mapping.upsert({
      where: { uid: defaultAdmin.uid },
      update: {},
      create: {
        uid: defaultAdmin.uid,
        accountId: defaultTenant.accountId,
        schemaName: 'public',
        tenantId: defaultTenant.id,
      }
    })

    const domainMapping = await prisma.domain_mapping.upsert({
      where: { fullDomain: defaultDomain.name },
      update: {},
      create: {
        fullDomain: defaultDomain.name,
        fullDomainUid: defaultDomain.id,
        tenantId: defaultTenant.id,
      }
    })

    for (const aclData of defaultAccessControls) {
      await prisma.pbx_access_controls.upsert({
          where: {
              id: aclData.id
          },
          update: {
              name: aclData.name,
              default: aclData.default,
              description: aclData.description,
              synchronised: aclData.synchronised ? new Date(aclData.synchronised) : null,
              updated: new Date(),
              updated_by: 'system',
          },
          create: {
              id: aclData.id,
              name: aclData.name,
              default: aclData.default,
              description: aclData.description,
              synchronised: aclData.synchronised ? new Date(aclData.synchronised) : null,
              created: new Date(),
              updated: new Date(),
              updated_by: 'system',
          }
      });
    }

    for (const nodeData of defaultAccessControlNodes) {
      await prisma.pbx_access_control_nodes.upsert({
          where: {
              id: nodeData.id
          },
          update: {
              type: nodeData.type,
              cidr: nodeData.cidr,
              domain: nodeData.domain,
              description: nodeData.description,
              synchronised: nodeData.synchronised ? new Date(nodeData.synchronised) : null,
              updated: new Date(),
              updated_by: 'system',
              access_control_id_id: nodeData.access_control_id_id,
          },
          create: {
              id: nodeData.id,
              type: nodeData.type,
              cidr: nodeData.cidr,
              domain: nodeData.domain,
              description: nodeData.description,
              synchronised: nodeData.synchronised ? new Date(nodeData.synchronised) : null,
              created: new Date(),
              updated: new Date(),
              updated_by: 'system',
              access_control_id_id: nodeData.access_control_id_id,
          }
      });
    }

    for (const profileData of defaultSipProfilesFull) {
      const sipProfile = await prisma.pbx_sip_profiles.upsert({
        where: { id: profileData.id },
        update: {
          name: profileData.name,
          hostname: profileData.hostname,
          disabled: profileData.disabled,
          description: profileData.description,
          synchronised: profileData.synchronised ? new Date(profileData.synchronised) : null,
          updated: new Date(),
          updated_by: 'system',
        },
        create: {
          id: profileData.id,
          name: profileData.name,
          hostname: profileData.hostname,
          disabled: profileData.disabled,
          description: profileData.description,
          synchronised: profileData.synchronised ? new Date(profileData.synchronised) : null,
          created: new Date(),
          updated: new Date(),
          updated_by: 'system',
        }
      });

      for (const domainData of profileData.pbx_sip_profile_domains) {
        await prisma.pbx_sip_profile_domains.upsert({
          where: { id: domainData.id },
          update: {
            name: domainData.name,
            alias: domainData.alias,
            parse: domainData.parse,
            synchronised: domainData.synchronised ? new Date(domainData.synchronised) : null,
            updated: new Date(),
            updated_by: 'system',
            sip_profile_id: sipProfile.id,
          },
          create: {
            id: domainData.id,
            name: domainData.name,
            alias: domainData.alias,
            parse: domainData.parse,
            synchronised: domainData.synchronised ? new Date(domainData.synchronised) : null,
            created: new Date(),
            updated: new Date(),
            updated_by: 'system',
            sip_profile_id: sipProfile.id,
          }
        });
      }

      for (const settingData of profileData.pbx_sip_profile_settings) {
        await prisma.pbx_sip_profile_settings.upsert({
          where: { id: settingData.id },
          update: {
            name: settingData.name,
            value: settingData.value,
            disabled: settingData.disabled,
            description: settingData.description,
            synchronised: settingData.synchronised ? new Date(settingData.synchronised) : null,
            updated: new Date(),
            updated_by: 'system',
            sip_profile_id: sipProfile.id,
          },
          create: {
            id: settingData.id,
            name: settingData.name,
            value: settingData.value,
            disabled: settingData.disabled,
            description: settingData.description,
            synchronised: settingData.synchronised ? new Date(settingData.synchronised) : null,
            created: new Date(),
            updated: new Date(),
            updated_by: 'system',
            sip_profile_id: sipProfile.id,
          }
        });
      }
    }

    // Seed Dialplan Defaults
    for (const dialplanDefault of dialplanDefaultsData.pbx_dialplan_defaults) {
      await prisma.pbx_dialplan_defaults.upsert({
        where: { id: dialplanDefault.id },
        update: {
          app_id: dialplanDefault.app_id,
          context: dialplanDefault.context,
          category: 'Default',
          name: dialplanDefault.name,
          number: dialplanDefault.number,
          destination: dialplanDefault.destination,
          dp_continue: dialplanDefault.dp_continue,
          dp_enabled: dialplanDefault.dp_enabled,
          xml: dialplanDefault.xml,
          sequence: dialplanDefault.sequence,
          enabled: 'true',
          description: dialplanDefault.description,
          synchronised: new Date(),
          updated: new Date(dialplanDefault.updated),
          updated_by: dialplanDefault.updated_by,
        },
        create: {
          id: dialplanDefault.id,
          app_id: dialplanDefault.app_id,
          context: dialplanDefault.context,
          category: 'Default',
          name: dialplanDefault.name,
          number: dialplanDefault.number,
          destination: dialplanDefault.destination,
          dp_continue: dialplanDefault.dp_continue, 
          dp_enabled: dialplanDefault.dp_enabled,
          xml: dialplanDefault.xml,
          sequence: dialplanDefault.sequence,
          enabled: 'true',
          description: dialplanDefault.description,
          created: new Date(dialplanDefault.created),
          updated: new Date(dialplanDefault.updated),
          synchronised: new Date(),
          updated_by: dialplanDefault.updated_by,
        }
      });
    }

    // seed variables

    for (const varsData of varsDefaultsData.pbx_vars) {
      await prisma.pbx_vars.upsert({
        where: { id: varsData.id },
        update: {
          id: varsData.id,
          category: varsData.category,
          name: varsData.name,
          value: varsData.value,
          command: varsData.command,
          hostname: varsData.hostname,
          enabled: varsData.enabled,
          sequence: varsData.sequence,
          description: varsData.description,
          updated: new Date(),
          synchronised: varsData.synchronised ? new Date(varsData.synchronised) : null,
          updated_by: varsData.updated_by,
        },
        create: {
          id: varsData.id,
          category: varsData.category,
          name: varsData.name,
          value: varsData.value,
          command: varsData.command,
          hostname: varsData.hostname,
          enabled: varsData.enabled,
          sequence: varsData.sequence,
          description: varsData.description,
          created: new Date(varsData.created),
          updated: new Date(varsData.updated),
          synchronised: varsData.synchronised ? new Date(varsData.synchronised) : null,
          updated_by: varsData.updated_by,
        }
      });
    }

    // seed Modules

    for (const moduleDefault of modulesDefaultsData.pbx_modules) {
      await prisma.pbx_modules.upsert({
        where: { id: moduleDefault.id },
        update: {
          id: moduleDefault.id,
          label: moduleDefault.label,
          name: moduleDefault.name,
          category: moduleDefault.category,
          sequence: moduleDefault.sequence,
          enabled: moduleDefault.enabled,
          default_enabled: moduleDefault.default_enabled,
          description: moduleDefault.description,
          updated: new Date(moduleDefault.updated),
          synchronised: moduleDefault.synchronised ? new Date(moduleDefault.synchronised) : null,
          updated_by: moduleDefault.updated_by
        },
        create: {
          id: moduleDefault.id,
          label: moduleDefault.label,
          name: moduleDefault.name,
          category: moduleDefault.category,
          sequence: moduleDefault.sequence,
          enabled: moduleDefault.enabled,
          default_enabled: moduleDefault.default_enabled,
          description: moduleDefault.description,
          created: new Date(moduleDefault.created),
          updated: new Date(moduleDefault.updated),
          synchronised: moduleDefault.synchronised ? new Date(moduleDefault.synchronised) : null,
          updated_by: moduleDefault.updated_by
        }
      });
    }

    // seed default settings

    for (const settingDefault of defaultSettingsData.pbx_default_settings) {
      await prisma.pbx_default_settings.upsert({
        where: { id: settingDefault.id },
        update: {
          id: settingDefault.id,
          app_uuid: settingDefault.app_uuid,
          category: settingDefault.category,
          subcategory: settingDefault.subcategory,
          value_type: settingDefault.value_type,
          value: settingDefault.value,
          sequence: settingDefault.sequence,
          enabled: settingDefault.enabled,
          description: settingDefault.description,
          updated: new Date(settingDefault.updated),
          synchronised: settingDefault.synchronised ? new Date(settingDefault.synchronised) : null,
          updated_by: settingDefault.updated_by
        },
        create: {
          id: settingDefault.id,
          app_uuid: settingDefault.app_uuid,
          category: settingDefault.category,
          subcategory: settingDefault.subcategory,
          value_type: settingDefault.value_type,
          value: settingDefault.value,
          sequence: settingDefault.sequence,
          enabled: settingDefault.enabled,
          description: settingDefault.description,
          created: new Date(settingDefault.created),
          updated: new Date(settingDefault.updated),
          synchronised: settingDefault.synchronised ? new Date(settingDefault.synchronised) : null,
          updated_by: settingDefault.updated_by
        }
      });
    }


    console.log('Seeded:', { 
      defaultTenant, 
      defaultDomain,
      defaultAdmin,
      userMapping,
      domainMapping,
      accessControls: 'Access Controls seeded',
      sipProfiles: 'SIP Profiles seeded',
      dialplanDefault: 'Dialplan Defaults seeded',
      varsData: 'Variables seeded',
      modulesDefault: 'Modules seeded',
      settingDefault: 'Default Settings seeded',
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seed()