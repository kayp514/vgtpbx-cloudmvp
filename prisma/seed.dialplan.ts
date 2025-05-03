import { PrismaClient } from '@prisma/client'
import dialplanDefaultsData from '../lib/resources/pbx_dialplan_defaults.json'

const prisma = new PrismaClient()

async function seedDialplanDefaults() {
  console.log('Starting to seed pbx_dialplan_defaults...');

  try {
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

    console.log('Successfully seeded pbx_dialplan_defaults.');

  } catch (error) {
    console.error('Error seeding pbx_dialplan_defaults:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  }
}


seedDialplanDefaults();