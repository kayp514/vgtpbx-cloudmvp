import { PrismaClient, Prisma } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

const TARGET_DOMAIN = 'target-domain'
const JSON_FILE_PATH = path.join(__dirname, '../lib/resources/pbx_dialplan_by_context.json')

interface PbxDialplanJsonEntry {
    id: string
    app_id: string
    hostname: string | null
    context: string
    category: string | null
    name: string | null
    number: string | null
    destination: string         
    dp_continue: string
    xml: string | null
    sequence: number
    enabled: string
    description: string | null
    created: string
    updated: string
    updated_by: string
    domain_id_id?: string
}

async function seedDomainDialplans() {
  console.log(`Starting dialplan seeding for domain: ${TARGET_DOMAIN}...`);

  try {
    // Find the domain mapping
    const domainMapping = await prisma.domain_mapping.findUnique({
      where: { fullDomain: TARGET_DOMAIN },
      select: {
        fullDomainUid: true,
        fullDomain: true,
        tenantId: true
      },
    });

    if (!domainMapping) {
      throw new Error(`Domain mapping not found for ${TARGET_DOMAIN}`);
    }

    // Verify the domain exists in pbx_domains
    const domain = await prisma.pbx_domains.findUnique({
      where: { id: domainMapping.fullDomainUid }
    });

    if (!domain) {
      console.log("Domain not found in pbx_domains, creating it...");
      
      // Create the domain if it doesn't exist
      await prisma.pbx_domains.create({
        data: {
          id: domainMapping.fullDomainUid,
          name: domainMapping.fullDomain,
          tenantId: domainMapping.tenantId,
          updatedBy: 'system',
          disabled: false
        }
      });
    }

    // Read the JSON file
    if (!fs.existsSync(JSON_FILE_PATH)) {
      throw new Error(`JSON file not found at ${JSON_FILE_PATH}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf-8'));
    const dialplanEntries: PbxDialplanJsonEntry[] = jsonData.pbx_dialplans;

    // Prepare data for seeding
    const dataToSeed = dialplanEntries.map(entry => ({
      id: entry.id,
      app_id: entry.app_id,
      hostname: entry.hostname,
      context: domainMapping.fullDomain,  
      category: entry.category,
      name: entry.name,
      number: entry.number,
      destination: entry.destination || 'false',
      dp_continue: entry.dp_continue || 'false',
      xml: entry.xml,
      sequence: new Decimal(entry.sequence),
      enabled: entry.enabled || 'true',
      description: entry.description,
      created: new Date(entry.created),
      updated: new Date(entry.updated),
      updated_by: entry.updated_by || 'system',
      domain_id_id: domainMapping.fullDomainUid
    }));

    // Create dialplans one by one to handle failures better
    console.log(`Seeding ${dataToSeed.length} dialplan entries...`);
    
    for (const data of dataToSeed) {
      try {
        await prisma.pbx_dialplans.upsert({
          where: { id: data.id },
          update: data,
          create: data
        });
        console.log(`Successfully created/updated dialplan: ${data.name || data.id}`);
      } catch (error) {
        console.error(`Error creating dialplan ${data.name || data.id}:`, error);
      }
    }

    console.log('Dialplan seeding completed successfully');

  } catch (error) {
    console.error('Error during dialplan seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedDomainDialplans()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });