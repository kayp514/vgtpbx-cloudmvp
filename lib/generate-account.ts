'use server'

import { getTenantByAccountId } from "@/lib/db/queries";

/**
 * Generates a unique 9-digit account ID that doesn't exist in the database
 * @returns Promise<string> A unique account ID
 */
export async function generateUniqueAccountId(): Promise<string> {
  let accountId: string;
  let existingTenant;
  
  do {
    accountId = Math.floor(100000000 + Math.random() * 900000000).toString();
    existingTenant = await getTenantByAccountId(accountId);
  } while (existingTenant);

  return accountId;
}