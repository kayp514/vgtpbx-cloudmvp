import { PrismaClient } from '@prisma/client'
import { BillingClient } from '@prisma/billing-client'

// Create base clients
const prisma = new PrismaClient()
const billingPrisma = new BillingClient()

export function getPbxConnection(accountId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Set schema for the current tenant - using the vgtpbx prefix
          args.schema = `vgtpbx_${accountId}`
          return query(args)
        },
      },
    },
  })
}

export function getBillingConnection(accountId: string) {
  return billingPrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Set schema for billing - using the vgtpbx_billing prefix
          args.schema = `vgtpbx_billing_${accountId}`
          return query(args)
        },
      },
    },
  })
}

// Create schema for new tenant
export async function createTenantSchemas(accountId: string) {
    const vgtpbxSchemaName = `vgtpbx_${accountId}`
    const vgtpbxBillingSchemaName = `vgtpbx_billing_${accountId}`
  // Create PBX schema
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS vgtpbx_${accountId}`)
  
  // Create Billing schema
  await billingPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS vgtpbx_billing_${accountId}`)
  
  // Run migrations for the new schemas
  await prisma.$migrate.deploy({ schema: `vgtpbx_${accountId}` })
  await billingPrisma.$migrate.deploy({ schema: `vgtpbx_billing_${accountId}` })
}