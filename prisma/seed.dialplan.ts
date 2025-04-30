import { PrismaClient } from './generated/client'
import dialplanDefaultsData from '../lib/db/pbx_dialplan_defaults_202504281444.json' // Adjust path if necessary

const prisma = new PrismaClient()

async function seedDialplanDefaults() {
  console.log('Starting to seed pbx_dialplan_defaults...');

  try {
    for (const dialplanDefault of dialplanDefaultsData.pbx_dialplan_defaults) {
      console.log(`Attempting to upsert dialplan default with ID: ${dialplanDefault.id}`);
      await prisma.pbx_dialplan_defaults.upsert({
        where: { id: dialplanDefault.id }, // Use the unique ID to check for existence
        update: {
          // Fields to update if the record exists
          app_id: dialplanDefault.app_id,
          context: dialplanDefault.context,
          category: dialplanDefault.category,
          name: dialplanDefault.name,
          number: dialplanDefault.number,
          destination: dialplanDefault.destination, // Keep as string 'true'/'false' based on schema
          dp_continue: dialplanDefault.dp_continue, // Keep as string 'true'/'false' based on schema
          xml: dialplanDefault.xml,
          sequence: dialplanDefault.sequence,
          enabled: dialplanDefault.enabled, // Keep as string 'true'/'false' based on schema
          description: dialplanDefault.description,
          synchronised: dialplanDefault.synchronised ? new Date(dialplanDefault.synchronised) : null,
          updated: new Date(dialplanDefault.updated),
          updated_by: dialplanDefault.updated_by,
        },
        create: {
          // Fields to create if the record does not exist
          id: dialplanDefault.id,
          app_id: dialplanDefault.app_id,
          context: dialplanDefault.context,
          category: dialplanDefault.category,
          name: dialplanDefault.name,
          number: dialplanDefault.number,
          destination: dialplanDefault.destination, // Keep as string 'true'/'false' based on schema
          dp_continue: dialplanDefault.dp_continue, // Keep as string 'true'/'false' based on schema
          xml: dialplanDefault.xml,
          sequence: dialplanDefault.sequence,
          enabled: dialplanDefault.enabled, // Keep as string 'true'/'false' based on schema
          description: dialplanDefault.description,
          created: new Date(dialplanDefault.created),
          updated: new Date(dialplanDefault.updated),
          synchronised: dialplanDefault.synchronised ? new Date(dialplanDefault.synchronised) : null,
          updated_by: dialplanDefault.updated_by,
        }
      });
    }

    console.log('Successfully seeded pbx_dialplan_defaults.');

  } catch (error) {
    console.error('Error seeding pbx_dialplan_defaults:', error);
    process.exit(1); // Exit with error code if seeding fails
  } finally {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  }
}


seedDialplanDefaults();