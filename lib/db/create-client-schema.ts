import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function createClientSchema(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  accountId: string
) {
  const schemaName = `vgtpbx_${accountId}`;
  
  try {
    // 1. Create schema
    await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // 2. Read the migration SQL file directly from lib/db/migration.sql
    const migrationPath = path.join(process.cwd(), 'lib/db/migration.sql');
    console.log('Reading migration from:', migrationPath);
    
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    console.log('Migration file read successfully');

    // 3. Extract and execute relevant statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      // Skip DROP statements and only include CREATE statements
      .filter(stmt => 
        !stmt.includes('DROP') && (
          stmt.includes('CREATE TABLE') || 
          stmt.includes('CREATE TYPE') ||
          stmt.includes('ALTER TABLE') ||
          stmt.includes('CREATE INDEX') ||
          stmt.includes('CREATE UNIQUE INDEX')
        )
      )
      .map(stmt => stmt
        .replace(/("vgtpbx_tenant")/g, `"${schemaName}"`)
        .replace(/\bvgtpbx_tenant\b/g, `${schemaName}`)
      )
      // Remove any remaining DROP references
      .filter(stmt => !stmt.includes('DROP CONSTRAINT'));

    console.log(`Executing ${statements.length} statements`);

    // 4. Execute each statement
    for (const statement of statements) {
      try {
        await tx.$executeRawUnsafe(`${statement};`);
      } catch (err) {
        // Skip if table/index already exists
        if (!(err instanceof Error) || 
            !err.message.includes('already exists')) {
          console.error('Failed to execute statement:', statement);
          throw err;
        }
      }
    }

    console.log('Schema creation completed');
    return true;
  } catch (error) {
    console.error('Error creating client schema:', error);
    throw error;
  }
}

// Utility function to check if a schema exists
export async function schemaExists(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  schemaName: string
): Promise<boolean> {
  try {
    const result = await tx.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      );
    `;
    return (result as any[])[0].exists;
  } catch (error) {
    console.error('Error checking schema existence:', error);
    return false;
  }
}

// Utility function to get all client schemas
export async function getClientSchemas(): Promise<string[]> {
  try {
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'vgtpbx_%';
    `;
    return (schemas as any[]).map(s => s.schema_name);
  } catch (error) {
    console.error('Error getting client schemas:', error);
    return [];
  }
}

// Function to drop a client schema (use with caution!)
export async function dropClientSchema(accountId: string): Promise<boolean> {
  const schemaName = `vgtpbx_${accountId}`;
  
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    return true;
  } catch (error) {
    console.error('Error dropping client schema:', error);
    throw new Error(`Failed to drop schema for client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to validate schema name
export function isValidSchemaName(accountId: string): boolean {
  // Add validation rules for schema names
  const schemaName = `vgtpbx_${accountId}`;
  const validSchemaRegex = /^vgtpbx_[a-zA-Z0-9_-]+$/;
  return validSchemaRegex.test(schemaName);
}

// Type for schema creation result
export interface SchemaCreationResult {
  success: boolean;
  schemaName: string;
  error?: string;
}

// Main function to create a new client schema with validation and checks
export async function initializeClientSchema(
  accountId: string,
  options: { 
    validateOnly?: boolean;
    ignoreExisting?: boolean;
  } = {}
): Promise<SchemaCreationResult> {
  const schemaName = `vgtpbx_${accountId}`;

  try {
    // Validate schema name
    if (!isValidSchemaName(accountId)) {
      throw new Error('Invalid account ID format');
    }

    // Check if schema already exists
    const exists = await schemaExists(tx, schemaName);
    if (exists && !options.ignoreExisting) {
      throw new Error('Schema already exists');
    }

    // If validation only, return here
    if (options.validateOnly) {
      return { success: true, schemaName };
    }

    // Create the schema and tables
    await createClientSchema(prisma, accountId);

    return { success: true, schemaName };
  } catch (error) {
    console.error('Error initializing client schema:', error);
    return {
      success: false,
      schemaName,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
