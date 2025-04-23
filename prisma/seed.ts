import { PrismaClient } from '@prisma/client'
import { DOMAIN_DEFAULTS, TENANT_DEFAULTS } from '../lib/db/types'
import { generateUniqueAccountId } from '@/lib/generate-account'
import { defaultAccessControlNodes, defaultAccessControls, defaultSipProfilesFull } from '../lib/db/switch-data'


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
        domain: 'vgtpbx.dev',
        description: 'Default tenant for system',
        plan: 'system',
        maxUsers: 1005,
        disabled: false
      },
    })

    const defaultDomain = await prisma.pbx_domains.upsert({
      where: { name: 'vgtpbx.dev' },
      update: {},
      create: {
        ...DOMAIN_DEFAULTS,
        name: 'vgtpbx.dev',
        description: 'Default system domain',
        tenantId: defaultTenant.id,
      }
    })

    const defaultAdmin = await prisma.auth_user.upsert({
      where: { email: 'admin@vgtpbx.dev' },
      update: {},
      create: {
        uid: crypto.randomUUID(),
        email: 'admin@vgtpbx.dev',
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
        tenantId: defaultTenant.id,
      }
    })

    for (const aclData of defaultAccessControls) {
      const seedACLs = await prisma.pbx_access_controls.upsert({
          where: {
              id: aclData.id
          },
          update: {
              name: aclData.name,
              default: aclData.default,
              description: aclData.description,
              synchronised: aclData.synchronised,
              updated: new Date(),
              updated_by: 'system',
          },
          create: {
              id: aclData.id,
              name: aclData.name,
              default: aclData.default,
              description: aclData.description,
              synchronised: aclData.synchronised,
              created: new Date(),
              updated: new Date(),
              updated_by: 'system',
          }
      });
  }

  for (const nodeData of defaultAccessControlNodes) {
    const seedACLNodes = await prisma.pbx_access_control_nodes.upsert({
        where: {
            id: nodeData.id
        },
        update: {
            type: nodeData.type,
            cidr: nodeData.cidr,
            domain: nodeData.domain,
            description: nodeData.description,
            synchronised: nodeData.synchronised,
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
            synchronised: nodeData.synchronised,
            created: new Date(),
            updated: new Date(),
            updated_by: 'system',
            access_control_id_id: nodeData.access_control_id_id,
        }
    });
}

    // Seed SIP Profiles and related data
    for (const profileData of defaultSipProfilesFull) {
      // First create the SIP Profile
      const sipProfile = await prisma.pbx_sip_profiles.upsert({
        where: { id: profileData.id },
        update: {
          name: profileData.name,
          hostname: profileData.hostname,
          disabled: profileData.disabled,
          description: profileData.description,
          synchronised: profileData.synchronised,
          updated: new Date(),
          updated_by: 'system',
        },
        create: {
          id: profileData.id,
          name: profileData.name,
          hostname: profileData.hostname,
          disabled: profileData.disabled,
          description: profileData.description,
          synchronised: profileData.synchronised,
          created: new Date(),
          updated: new Date(),
          updated_by: 'system',
        }
      });

      // Then create its domains
      for (const domainData of profileData.pbx_sip_profile_domains) {
        await prisma.pbx_sip_profile_domains.upsert({
          where: { id: domainData.id },
          update: {
            name: domainData.name,
            alias: domainData.alias,
            parse: domainData.parse,
            synchronised: domainData.synchronised,
            updated: new Date(),
            updated_by: 'system',
            sip_profile_id: sipProfile.id,
          },
          create: {
            id: domainData.id,
            name: domainData.name,
            alias: domainData.alias,
            parse: domainData.parse,
            synchronised: domainData.synchronised,
            created: new Date(),
            updated: new Date(),
            updated_by: 'system',
            sip_profile_id: sipProfile.id,
          }
        });
      }

      // Finally create its settings
      for (const settingData of profileData.pbx_sip_profile_settings) {
        await prisma.pbx_sip_profile_settings.upsert({
          where: { id: settingData.id },
          update: {
            name: settingData.name,
            value: settingData.value,
            disabled: settingData.disabled,
            description: settingData.description,
            synchronised: settingData.synchronised,
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
            synchronised: settingData.synchronised,
            created: new Date(),
            updated: new Date(),
            updated_by: 'system',
            sip_profile_id: sipProfile.id,
          }
        });
      }
    }

    console.log('Seeded:', { 
      defaultTenant, 
      defaultDomain,
      defaultAdmin,
      userMapping,
      domainMapping,
      sipProfiles: 'SIP Profiles and related data seeded successfully'
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seed()