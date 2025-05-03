import type {
  AuthUserFull, 
  DatabaseUserInput, 
  Extension,
  ExtensionCreateInput,
  ExtensionUpdateInput,
  ExtensionDisplay,
  Gateway,
  GatewayCreateInput,
  GatewayUpdateInput,
  GatewayDisplay,
  Domain,
  DomainCreateInput,
  DomainUpdateInput,
  DomainDisplay,
  DomainSettingCreateInput,
  AccessControl,
  AccessControlCreateInput,
  AccessControlUpdateInput,
  AccessControlDisplay,
  EmailTemplate,
  EmailTemplateCreateInput,
  EmailTemplateUpdateInput,
  EmailTemplateDisplay,
  Module,
  ModuleCreateInput,
  ModuleUpdateInput,
  ModuleDisplay,
  Variable,
  VariableCreateInput,
  VariableUpdateInput,
  VariableDisplay,
  Tenant,
  TenantCreateInput,
  TenantUpdateInput,
  TenantDisplay,
  PbxUserCreateInput,
  PbxUserUpdateInput,
  PbxUserDisplay,
  PbxUserFull,  
} from "@/lib/db/types"
import { 
  AUTH_USER_DEFAULTS, 
  DEFAULT_EXTENSION_VALUES, 
  EXTENSION_USER_DEFAULTS,
  EMAIL_TEMPLATE_DEFAULTS, 
  GATEWAY_DEFAULTS,
  DOMAIN_DEFAULTS,
  DOMAIN_SETTING_DEFAULTS,
  ACCESS_CONTROL_DEFAULTS,
  ACCESS_CONTROL_NODE_DEFAULTS,
  MODULE_DEFAULTS,
  VARIABLE_DEFAULTS,
  TENANT_DEFAULTS,
  PBX_USER_DEFAULTS,
  PBX_USER_SETTING_DEFAULTS,
} from '@/lib/db/types'

import { prisma } from '@/lib/prisma'
import { createClientSchema, schemaExists } from "./create-client-schema"
import { clientSchemaQueries } from "./sql"



const isDevelopment = process.env.NODE_ENV === 'development'

const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000' 
  : process.env.NEXT_PUBLIC_API_URL || 'https://vgtpbx.dev'


interface VerifyAuthUserResult {
  exists: boolean;
  user: {
    uid: string;
    email: string;
    displayName: string | null;
    disabled: boolean;
    emailVerified: boolean;
    tenantId: string;
    pbx_user?: {
      id: bigint;
      username: string;
      status: string;
      disabled: boolean;
    };
    tenant: {
      id: string;
      disabled: boolean;
      plan: string;
      maxUsers: number;
    };
  } | null;
  error?: string;
}


interface DialplanParams {
  callerContext: string;
  hostname: string;
  destinationNumber?: string;
  domain?: string;
}


export async function createUserWithPbx(
  authInput: DatabaseUserInput,
  pbxInput?: Partial<PbxUserCreateInput>,
  tenantInput?: TenantCreateInput 
): Promise<{
  authUser: AuthUserFull;
  pbxUser: PbxUserFull;
  tenant: Tenant;
  domain: Domain;
}> {
  try {
    return await prisma.$transaction(async (tx) => {

      const subdomainName = authInput.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
      authInput.email.split('@')[0].toLowerCase();

      const tenant = await tx.auth_tenant.create({
        data: {
          ...TENANT_DEFAULTS,
          id: crypto.randomUUID(),
          accountId: tenantInput!.accountId,
          name: tenantInput!.name,
          domain: tenantInput!.domain,
          description: tenantInput?.description,
          plan: tenantInput?.plan || 'basic',
          maxUsers: tenantInput?.maxUsers || 5,
        }
      });


      const domain = await tx.pbx_domains.create({
        data: {
          ...DOMAIN_DEFAULTS,
          name: `${subdomainName}.${tenant.domain}`,
          description: `Domain for ${authInput!.email}`,
          tenantId: tenant.id
        }
      });

      const authUser = await tx.auth_user.create({
        data: {
          ...AUTH_USER_DEFAULTS,
          ...authInput,
          tenantId: tenant.id
        },
        include: {
          auth_tenant: true,
        }
      });


      const pbxUser = await tx.pbx_users.create({
        data: {
          ...PBX_USER_DEFAULTS,
          username: authInput.email.split('@')[0],
          email: authInput.email,
          department: pbxInput?.department || '',
          domainId: domain.id,
          auth_user_id: authUser.uid,
          ...pbxInput,
        },
        include: {
          auth_user: true
        }
      });

      return { 
        authUser, 
        pbxUser,
        tenant,
        domain 
      };
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        throw new Error('User with this email or username already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
    throw new Error('Failed to create user');
  }
}

export async function createUserWithPbxOwnSchema(
  authInput: DatabaseUserInput,
  pbxInput?: Partial<PbxUserCreateInput>,
  tenantInput?: TenantCreateInput 
): Promise<{
  authUser: AuthUserFull;
  pbxUser: PbxUserFull;
  tenant: Tenant;
  domain: Domain;
}> {
  try {
    const schemaName = `vgtpbx_${tenantInput!.accountId}`;
    
    return await prisma.$transaction(async (tx) => {
      // 1. Create tenant using Prisma
      const tenant = await tx.auth_tenant.create({
        data: {
          ...TENANT_DEFAULTS,
          id: crypto.randomUUID(),
          accountId: tenantInput!.accountId,
          name: tenantInput!.name,
          domain: tenantInput!.domain,
          description: tenantInput?.description,
          plan: tenantInput?.plan || 'basic',
          maxUsers: tenantInput?.maxUsers || 5,
        }
      });

      // 2. Create schema - execute separately
      await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      
      // 3. Create tables - execute each separately
      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".pbx_domains (
          id UUID PRIMARY KEY,
          name VARCHAR(128) NOT NULL UNIQUE,
          disabled BOOLEAN NOT NULL DEFAULT false,
          description VARCHAR(128),
          created TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
          synchronised TIMESTAMPTZ(6),
          "updatedBy" VARCHAR(64) NOT NULL DEFAULT 'system',
          "homeSwitch" VARCHAR(128),
          "menuId" UUID,
          "portalName" VARCHAR(128),
          "tenantId" VARCHAR(50) NOT NULL
        )`);

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".auth_user (
          uid VARCHAR(50) NOT NULL PRIMARY KEY,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          "displayName" VARCHAR(100),
          "firstName" VARCHAR(150),
          "lastName" VARCHAR(150),
          avatar VARCHAR(255),
          "phoneNumber" VARCHAR(20),
          "isSuperuser" BOOLEAN NOT NULL DEFAULT false,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "isStaff" BOOLEAN NOT NULL DEFAULT false,
          "emailVerified" BOOLEAN NOT NULL DEFAULT false,
          disabled BOOLEAN NOT NULL DEFAULT false,
          "tenantId" VARCHAR(50) NOT NULL,
          "createdAt" TIMESTAMP(3),
          "lastSignInAt" TIMESTAMP(3)
        )`);

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".pbx_users (
          id BIGSERIAL PRIMARY KEY,
          user_uuid UUID NOT NULL,
          username VARCHAR(150) NOT NULL,
          email VARCHAR(254),
          department VARCHAR(50),
          status VARCHAR(32) NOT NULL,
          api_key VARCHAR(254),
          disabled BOOLEAN NOT NULL DEFAULT false,
          created TIMESTAMPTZ(6),
          updated TIMESTAMPTZ(6),
          synchronised TIMESTAMPTZ(6),
          "updatedBy" VARCHAR(64) NOT NULL,
          "domainId" UUID,
          auth_user_id VARCHAR(50) NOT NULL,
          FOREIGN KEY ("domainId") REFERENCES "${schemaName}".pbx_domains(id) ON DELETE CASCADE,
          FOREIGN KEY (auth_user_id) REFERENCES "${schemaName}".auth_user(uid) ON DELETE CASCADE
        )`);

      const subdomainName = authInput.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
        authInput.email.split('@')[0].toLowerCase();

      const domainId = crypto.randomUUID();
      const domainName = `${subdomainName}.${tenant.domain}`;
      const domainDescription = `Domain for ${authInput.email}`;

      // 4. Insert domain
      const [domain] = await tx.$queryRawUnsafe(`
        INSERT INTO "${schemaName}".pbx_domains (
          id, name, disabled, description, created, updated,
          "updatedBy", "homeSwitch", "menuId", "portalName", "tenantId"
        ) VALUES (
          $1::uuid, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
          $5, $6::uuid, $7::uuid, $8, $9
        ) RETURNING *`,
        domainId,
        domainName,
        false,
        domainDescription,
        'system',
        null, // homeSwitch
        null, // menuId
        null, // portalName
        tenant.id
      ) as [Domain];

      // 5. Insert auth user
      const [authUserResult] = await tx.$queryRawUnsafe(`
        INSERT INTO "${schemaName}".auth_user (
          uid, "updatedAt", email, "displayName", "firstName",
          "lastName", avatar, "phoneNumber", "isSuperuser",
          "isAdmin", "isStaff", "emailVerified", disabled,
          "tenantId", "createdAt", "lastSignInAt"
        ) VALUES (
          $1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, $14
        ) RETURNING *`,
        authInput.uid,
        authInput.email,
        authInput.displayName,
        authInput.firstName,
        authInput.lastName,
        authInput.avatar,
        authInput.phoneNumber,
        authInput.isSuperuser,
        authInput.isAdmin,
        authInput.isStaff,
        authInput.emailVerified,
        authInput.disabled,
        tenant.id,
        authInput.lastSignInAt
      ) as [AuthUserFull];

      // 6. Insert pbx user
      const [pbxUserResult] = await tx.$queryRawUnsafe(`
        INSERT INTO "${schemaName}".pbx_users (
          user_uuid, username, email, department, status,
          disabled, created, updated, "updatedBy",
          "domainId", auth_user_id
        ) VALUES (
          $1::uuid, $2, $3, $4, $5, $6,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7,
          $8::uuid, $9
        ) RETURNING *`,
        crypto.randomUUID(),
        authInput.email.split('@')[0],
        authInput.email,
        pbxInput?.department || '',
        PBX_USER_DEFAULTS.status,
        PBX_USER_DEFAULTS.disabled,
        'system',
        domainId,
        authInput.uid
      ) as [Omit<PbxUserFull, 'auth_user'>];

      // Construct the full objects with their relationships
      const authUser = authUserResult as AuthUserFull;
      Object.defineProperty(authUser, 'auth_tenant', {
        enumerable: true,
        value: tenant
      });

      const pbxUser = {
        ...pbxUserResult,
        auth_user: authUser
      } as PbxUserFull;

      Object.defineProperty(authUser, 'pbx_users', {
        enumerable: true,
        value: pbxUser
      });

      return { 
        authUser,
        pbxUser,
        tenant,
        domain
      };
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createUserWithPbxOwnSchemaFile(
  authInput: DatabaseUserInput,
  pbxInput?: Partial<PbxUserCreateInput>,
  tenantInput?: TenantCreateInput 
): Promise<{
  authUser: AuthUserFull;
  pbxUser: PbxUserFull;
  tenant: Tenant;
  domain: Domain;
}> {
  try {
    return await prisma.$transaction(async (tx) => {
      console.log('Starting transaction...');
      // 1. Create tenant in public schema
      console.log('Creating tenant...', tenantInput?.accountId);
      const tenant = await tx.auth_tenant.create({
        data: {
          ...TENANT_DEFAULTS,
          id: crypto.randomUUID(),
          accountId: tenantInput!.accountId,
          name: tenantInput!.name,
          domain: tenantInput!.domain,
          description: tenantInput?.description,
          plan: tenantInput?.plan || 'basic',
          maxUsers: tenantInput?.maxUsers || 5,
        }
      });

      // 2. Create schema and tables using the schema utility
      console.log('Creating schema...', tenantInput!.accountId);
      await createClientSchema(tx, tenantInput!.accountId).catch(error => {
        console.error('Failed to create schema:', error);
        throw error;
      });
      console.log('Schema created successfully');

      // 3. Prepare domain data
      const subdomainName = authInput.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
        authInput.email.split('@')[0].toLowerCase();
      const domainId = crypto.randomUUID();
      const domainName = `${subdomainName}.${tenant.domain}`;
      const domainDescription = `Domain for ${authInput.email}`;
      const schemaName = `vgtpbx_${tenantInput!.accountId}`;

      const schemaExistsCheck = await schemaExists(tx, schemaName);
      if (!schemaExistsCheck) {
         throw new Error(`Schema ${schemaName} does not exist after creation attempt.`);
      }
      console.log(`Schema ${schemaName} confirmed to exist.`);

      // 4. Insert domain
      const [domain] = await clientSchemaQueries.insertDomain(
        tx,
        schemaName,
        domainId,
        domainName,
        false,
        domainDescription,
        'system',
        null,
        null,
        null,
        tenant.id
      ) as Domain[];

      if (!domain?.id) {
        throw new Error('Failed to create domain');
      }

      // 5. Insert auth user
      const [authUser] = await clientSchemaQueries.insertAuthUser(tx, {
        ...authInput,
        tenantId: tenant.id
      }) as AuthUserFull[];

      if (!authUser?.uid) {
        throw new Error('Failed to create auth user');
      }

      // 6. Insert pbx user
      const [pbxUser] = await clientSchemaQueries.insertPbxUser(
        tx,
        schemaName,
        crypto.randomUUID(),
        authInput.email.split('@')[0],
        authInput.email,
        pbxInput?.department || '',
        PBX_USER_DEFAULTS.status,
        PBX_USER_DEFAULTS.disabled,
        'system',
        domain.id,
        authUser.uid
      ) as PbxUserFull[];

      if (!pbxUser?.user_uuid) {
        throw new Error('Failed to create PBX user');
      }

      const userMapping = await tx.auth_user_mapping.create({
        data: {
          uid: authUser.uid,
          accountId: tenant.accountId,
          schemaName: schemaName,
          tenantId: tenant.id,
        }
      });

      if (!userMapping?.uid) {
        throw new Error('Failed to create user mapping');
      }

      const domainMapping = await tx.domain_mapping.create({
        data: {
          fullDomain: domain.name, // This is the full domain name (e.g., subdomain.vgtpbx.dev)
          fullDomainUid: domain.id,
          tenantId: tenant.id,
        }
      });

      if (!domainMapping?.id) {
        throw new Error('Failed to create domain mapping')
      }


      return { 
        authUser,
        pbxUser,
        tenant,
        domain
      };
    }, {
      timeout: 30000 // Increased timeout for schema creation
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        throw new Error('Schema or user already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
    throw new Error('Failed to create user');
  }
}


export async function createAuthUser(input: DatabaseUserInput): Promise<AuthUserFull> {
  try {
    return await prisma.auth_user.create({
      data: {
        ...AUTH_USER_DEFAULTS,
        ...input,
      },
      include: {
        auth_tenant: true,
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create auth user');
  }
}


export async function verifyAuthUser(
  uid: string,
  tenantId: string
): Promise<VerifyAuthUserResult> {
  try {
    const user = await prisma.auth_user.findFirst({
      where: {
        AND: [
          { uid },
          { tenantId },
          { disabled: false },
        ]
      },
      select: {
        uid: true,
        email: true,
        displayName: true,
        disabled: true,
        emailVerified: true,
        tenantId: true,
        pbx_users: {
          select: {
            id: true,
            username: true,
            disabled: true,
            status: true,
          }
        },
        auth_tenant: {
          select: {
            id: true,
            accountId: true,
            name: true,
            disabled: true,
            plan: true,
            maxUsers: true,
          }
        }
      }
    });

    if (!user) {
      return {
        exists: false,
        user: null,
        error: 'User not found'
      };
    }

    const transformedUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      tenantId: user.tenantId,
      pbx_user: user.pbx_users || undefined,
      tenant: {
        id: user.auth_tenant.id,
        accountId: user.auth_tenant.accountId,
        disabled: user.auth_tenant.disabled,
        plan: user.auth_tenant.plan,
        maxUsers: user.auth_tenant.maxUsers
      }
    };

    if (user.auth_tenant.disabled) {
      return {
        exists: true,
        user: transformedUser,
        error: 'User does not belong to this tenant'
      };
    }

    if (!user.emailVerified) {
      return {
        exists: true,
        user: transformedUser,
        error: 'Email not verified'
      };
    }

    return {
      exists: true,
      user: transformedUser,
      error: undefined
    };

  } catch (error) {
    console.error('Error verifying auth user:', error);
    return {
      exists: false,
      user: null,
      error: error instanceof Error ? error.message : 'Failed to verify user'
    };
  }
}



export async function listPbxUsers(): Promise<PbxUserDisplay[]> {
  try {
    return await prisma.pbx_users.findMany({
      select: {
        id: true,
        auth_user_id: true,
        username: true,
        email: true,
        status: true,
        disabled: true,
        user_uuid: true,
        auth_user: {
          select: {
            displayName: true,
            firstName: true,
            lastName: true,
            isSuperuser: true,
            isAdmin: true,
            isStaff: true,
            avatar: true,
          }
        }
      },
      orderBy: { created: 'desc' }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
  }
}


export async function getPbxUser(id: bigint): Promise<PbxUserFull | null> {
  try {
    return await prisma.pbx_users.findUnique({
      where: { id },
      include: {
        pbx_user_settings: true,
        auth_user: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
  }
}


export async function getPbxUserByAccountId(accountId: string): Promise<PbxUserFull | null> {
  try {
    // First find the tenant by accountId
    const tenant = await prisma.auth_tenant.findUnique({
      where: { accountId }
    });

    if (!tenant) {
      throw new Error('Tenant not found for the given account ID');
    }

    // Then find the auth user associated with this tenant
    const pbxUser = await prisma.pbx_users.findFirst({
      where: {
        auth_user: {
          tenantId: tenant.id
        }
      },
      include: {
        pbx_user_settings: true,
        auth_user: {
          include: {
            auth_tenant: true
          }
        }
      }
    });

    return pbxUser;
  } catch (error) {
    console.error('Error fetching user by account ID:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch user by account ID');
  }
}

export async function getPbxUsersByAccountId(accountId: string): Promise<PbxUserFull[]> {
  try {
    const tenant = await prisma.auth_tenant.findUnique({
      where: { accountId },
      include: {
        users: {
          include: {
            pbx_users: {
              include: {
                pbx_user_settings: true,
                auth_user: true
              }
            }
          }
        }
      }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Map and filter out null values
    const pbxUsers = tenant.users
      .map(user => user.pbx_users)
      .filter((user): user is PbxUserFull => user !== null);

    return pbxUsers;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch users by account ID');
  }
}


export async function createPbxUser(input: PbxUserCreateInput): Promise<PbxUserFull> {
  try {

    const authUser = await prisma.auth_user.findUnique({
      where: { uid: input.auth_user_id }
    });

    if (!authUser) {
      throw new Error('Auth user not found');
    }

    const { settings, ...userData } = input;

    return await prisma.pbx_users.create({
      data: {
        ...PBX_USER_DEFAULTS,
        ...userData,
        pbx_user_settings: settings ? {
          create: settings.map(setting => ({
            ...PBX_USER_SETTING_DEFAULTS,
            ...setting
          }))
        } : undefined
      },
      include: {
        pbx_user_settings: true,
        auth_user: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create user');
  }
}


export async function PbxupdateUser(
  id: bigint, 
  data: PbxUserUpdateInput
): Promise<PbxUserFull> {
  try {
    const { settings, ...userData } = data;

    return await prisma.pbx_users.update({
      where: { id },
      data: {
        ...userData,
        updated: new Date(),
        updatedBy: data.updatedBy || 'system',
        pbx_user_settings: settings ? {
          deleteMany: {},  // Remove existing settings
          create: settings.map(setting => ({
            ...PBX_USER_SETTING_DEFAULTS,
            ...setting
          }))
        } : undefined
      },
      include: {
        pbx_user_settings: true,
        auth_user: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update user');
  }
}


export async function PbxdeleteUser(id: bigint): Promise<void> {
  try {
    await prisma.pbx_users.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
  }
}


  
export async function createUserOld(input: DatabaseUserInput | null) {
      console.log("user: createUser received input:", input); 
    if (!input) {
      console.error("user: Input is null in createUser");
      throw new Error("User input data is required")
    }
  
  
    try {
      // Create a sanitized version of the input data
      const sanitizedData = {
          uid: input.uid,
          email: input.email.toLowerCase(),
          displayName: input.displayName,
          firstName: input.firstName,
          lastName: input.lastName,
          avatar: input.avatar,
          tenantId: input.tenantId,
          isSuperuser: input.isSuperuser,
          isAdmin: input.isAdmin,
          isStaff: input.isStaff,
          phoneNumber: input.phoneNumber,
          emailVerified: input.emailVerified,
          disabled: input.disabled,
          createdAt: input.createdAt,
          lastSignInAt: input.lastSignInAt,
          updatedAt: new Date(),
        }
  
      console.log("user: Cleaned user data:", sanitizedData)
  
  
      const user = await prisma.auth_user.create({
        data: sanitizedData,
        select: {
          uid: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          avatar: true,
          tenantId: true,
          isSuperuser: true,
          isAdmin: true,
          isStaff: true,
          phoneNumber: true,
          emailVerified: true,
          disabled: true,
          updatedAt: true,
          createdAt: true,
          lastSignInAt: true,
        },
      })
  
      if (!user) {
        throw new Error("Failed to create user: No user returned from database")
      }
  
      console.log("Prisma create operation returned:", user); 
  
      return user
    } catch (error) {
      console.error("Detailed error in createUser:", {
          error,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          errorStack: error instanceof Error ? error.stack : undefined,
        })
      if (error instanceof Error) {
        if (error.message.includes("Unique constraint")) {
          throw new Error("User with this email or uid already exists")
        }
        if (error.message.includes("Foreign key constraint")) {
          throw new Error("Invalid tenant ID")
        }
        throw new Error(`Failed to create user: ${error.message}`)
      }
      throw new Error("Failed to create user: Unknown error")
    }
  }
  
  
export async function verifyDatabaseUser(uid: string): Promise<{
  success: boolean;
  user?: {
    uid: string;
    email: string;
    displayName: string | null;
    tenantId: string;
    isAdmin: boolean;
    emailVerified: boolean;
    disabled: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}> {
  try {
    const dbUser = await prisma.auth_user.findUnique({
      where: { uid },
      select: {
        uid: true,
        email: true,
        displayName: true,
        tenantId: true,
        isAdmin: true,
        emailVerified: true,
        disabled: true,
      }
    })
    
    if (!dbUser) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in database'
        }
      }
    }
    
    if (dbUser.disabled) {
      return {
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      }
    }
    
    return {
      success: true,
      user: dbUser
    }
  } catch (error) {
    console.error('Error verifying database user:', error)
    return {
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify user'
      }
    }
  }
}
  
  

export async function listDomains(): Promise<DomainDisplay[]> {
  try {
    return await prisma.pbx_domains.findMany({
      select: {
        id: true,
        name: true,
        tenantId: true,
        portalName: true,
        homeSwitch: true,
        description: true,
        disabled: true,
      },
      orderBy: { created: 'desc' }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch domains');
  }
}

export async function getDomain(id: string): Promise<Domain | null> {
  try {
    return await prisma.pbx_domains.findUnique({
      where: { id },
      include: {
        domain_settings: true,
      }
    });
  } catch (error) {
    console.error('Error fetching domain:', error)
    throw error
  }
}

export async function createDomain(input: DomainCreateInput): Promise<Domain> {
  try {
    const { settings, ...domainData } = input;

    return await prisma.pbx_domains.create({
      data: {
        ...DOMAIN_DEFAULTS,
        ...domainData,
        domain_settings: settings ? {
          create: settings.map(setting => ({
            ...DOMAIN_SETTING_DEFAULTS,
            ...setting
          }))
        } : undefined
      },
      include: {
        domain_settings: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create domain');
  }
}


export async function updateDomain(
  id: string, 
  data: DomainUpdateInput
): Promise<Domain> {
  try {
    const { settings, ...domainData } = data;

    return await prisma.pbx_domains.update({
      where: { id },
      data: {
        ...domainData,
        updated: new Date(),
        updatedBy: data.updatedBy || 'system',
        domain_settings: settings ? {
          deleteMany: {},
          create: settings.map(setting => ({
            ...DOMAIN_SETTING_DEFAULTS,
            ...setting
          }))
        } : undefined
      },
      include: {
        domain_settings: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update domain');
  }
}

export async function deleteDomain(id: string): Promise<void> {
  try {
    await prisma.pbx_domains.delete({
      where: { id },
      include: {
        domain_settings: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete domain');
  }
}

export async function listAccessControls(): Promise<AccessControlDisplay[]> {
  try {
    return await prisma.pbx_access_controls.findMany({
      select: {
        id: true,
        name: true,
        default: true,
        description: true,
      },
      orderBy: { created: 'desc' }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch access controls');
  }
}


export async function getAccessControl(id: string): Promise<AccessControl | null> {
  try {
    return await prisma.pbx_access_controls.findUnique({
      where: { id },
      include: {
        pbx_access_control_nodes: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch access control');
  }
}

export async function createAccessControl(input: AccessControlCreateInput): Promise<AccessControl> {
  try {
    const { nodes, ...accessControlData } = input;

    return await prisma.pbx_access_controls.create({
      data: {
        ...ACCESS_CONTROL_DEFAULTS,
        ...accessControlData,
        pbx_access_control_nodes: nodes ? {
          create: nodes.map(node => ({
            ...ACCESS_CONTROL_NODE_DEFAULTS,
            ...node
          }))
        } : undefined
      },
      include: {
        pbx_access_control_nodes: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create access control');
  }
}


export async function updateAccessControl(
  id: string, 
  data: AccessControlUpdateInput
): Promise<AccessControl> {
  try {
    const { nodes, ...accessControlData } = data;

    return await prisma.pbx_access_controls.update({
      where: { id },
      data: {
        ...accessControlData,
        updated: new Date(),
        updated_by: data.updated_by || 'system',
        pbx_access_control_nodes: nodes ? {
          deleteMany: {},  // Remove existing nodes
          create: nodes.map(node => ({
            ...ACCESS_CONTROL_NODE_DEFAULTS,
            ...node
          }))
        } : undefined
      },
      include: {
        pbx_access_control_nodes: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update access control');
  }
}


export async function deleteAccessControl(id: string): Promise<void> {
  try {
    await prisma.pbx_access_controls.delete({
      where: { id },
      include: {
        pbx_access_control_nodes: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete access control');
  }
}

export async function listEmailTemplates(): Promise<EmailTemplateDisplay[]> {
  try {
    return await prisma.pbx_email_templates.findMany({
      select: {
        id: true,
        language: true,
        category: true,
        subcategory: true,
        subject: true,
        type: true,
        enabled: true,
        description: true,
      },
      orderBy: { created: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch email templates');
  }
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  try {
    return await prisma.pbx_email_templates.findUnique({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch email template');
  }
}

export async function createEmailTemplate(
  input: EmailTemplateCreateInput
): Promise<EmailTemplate> {
  try {
    return await prisma.pbx_email_templates.create({
      data: {
        ...EMAIL_TEMPLATE_DEFAULTS,
        ...input,
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create email template');
  }
}


export async function updateEmailTemplate(
  id: string, 
  data: EmailTemplateUpdateInput
): Promise<EmailTemplate> {
  try {
    return await prisma.pbx_email_templates.update({
      where: { id },
      data: {
        ...data,
        updated: new Date(),
        updatedBy: data.updatedBy || 'system',
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update email template');
  }
}


export async function deleteEmailTemplate(id: string): Promise<void> {
  try {
    await prisma.pbx_email_templates.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete email template');
  }
}

export async function listExtensions(): Promise<ExtensionDisplay[]> {
  try {
    return await prisma.pbx_extensions.findMany({
      select: {
        id: true,
        extension: true,
        effective_caller_id_name: true,
        effective_caller_id_number: true,
        call_group: true,
        user_context: true,
        disabled: true,
      },
      orderBy : { created: 'desc' }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch extensions');
  }
}

export async function getExtension(id: string): Promise<Extension | null> {
  try {
    return await prisma.pbx_extensions.findUnique({
      where: { id },
      include: {
        pbx_extension_users: true,
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch extension');
  }
}

export async function createExtension(
  input: ExtensionCreateInput
): Promise<Extension> {
  try {
    const { users, ...extensionData } = input;

    return await prisma.pbx_extensions.create({
       data: {
        ...DEFAULT_EXTENSION_VALUES,
        ...extensionData,
        pbx_extension_users: users ? {
          create: users.map(user => ({
            ...EXTENSION_USER_DEFAULTS,
            ...user,
          })),
        } : undefined,
       },
       include: {
        pbx_extension_users: true,
      }
      });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create extension');
  }
}

export async function updateExtension(
  id: string, 
  data: ExtensionUpdateInput
): Promise<Extension> {
  try {
    const { users, ...extensionData } = data;

    return await prisma.pbx_extensions.update({
      where: { id },
      data :{
        ...extensionData,
        updated: new Date(),
        updated_by: data.updated_by || 'system',
        pbx_extension_users: users ? {
          deleteMany: {},
          create: users.map(user => ({
            ...EXTENSION_USER_DEFAULTS,
            ...user,
          })),
        }: undefined,
      },
      include: {
        pbx_extension_users: true,
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update extension');
  }
}


export async function getExtensionSettings(id: string): Promise<Extension | null> {
  try {
    return await prisma.pbx_extensions.findUnique({
      where: { id },
      include: {
        pbx_extension_users: true,
      }
    });
  } catch (error) {
    console.error('Error fetching extension settings:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch extension settings');
  }
}

export async function deleteExtension(id: string): Promise<void> {
  try {
    await prisma.pbx_extensions.delete({
      where: { id },
      include: {
        pbx_extension_users: true,
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete extension');
  }
}

export async function listGateways(): Promise<GatewayDisplay[]> {
  try {
    return await prisma.pbx_gateways.findMany({
      select: {
        id: true,
        gateway: true,
        proxy: true,
        context: true,
        enabled: true,
        description: true,
        profile: true,
      },
      orderBy: { created: 'desc' }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch gateways');
  }
}


export async function getGateway(id: string): Promise<Gateway | null> {
  try {
    return await prisma.pbx_gateways.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching gateways:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch gateway');
  }
}

export async function createGateway(input: GatewayCreateInput): Promise<Gateway> {
  try {
    return await prisma.pbx_gateways.create({
      data: {
        ...GATEWAY_DEFAULTS,
        ...input,
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create gateway');
  }
}

export async function updateGateway(
  id: string, 
  data: GatewayUpdateInput
): Promise<Gateway> {
  try {
    return await prisma.pbx_gateways.update({
      where: { id },
      data: {
        ...data,
        updated: new Date(),
        updated_by: data.updated_by || 'system',
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update gateway');
  }
}

export async function deleteGateway(id: string): Promise<void> {
  try {
    await prisma.pbx_gateways.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete gateway');
  }
}


export async function listModules(): Promise<ModuleDisplay[]> {
  try {
    return await prisma.pbx_modules.findMany({
      select: {
        id: true,
        label: true,
        name: true,
        category: true,
        enabled: true,
        default_enabled: true,
        description: true,
      },
      orderBy: { sequence: 'asc' }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch modules');
  }
}


export async function getModule(id: string): Promise<Module | null> {
  try {
    return await prisma.pbx_modules.findUnique({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch module');
  }
}


export async function createModule(input: ModuleCreateInput): Promise<Module> {
  try {
    return await prisma.pbx_modules.create({
      data: {
        ...MODULE_DEFAULTS,
        ...input,
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create module');
  }
}


export async function updateModule(
  id: string, 
  data: ModuleUpdateInput
): Promise<Module> {
  try {
    return await prisma.pbx_modules.update({
      where: { id },
      data: {
        ...data,
        updated: new Date(),
        updated_by: data.updated_by || 'system',
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update module');
  }
}


export async function deleteModule(id: string): Promise<void> {
  try {
    await prisma.pbx_modules.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete module');
  }
}


export async function listVariables(): Promise<VariableDisplay[]> {
  try {
    return await prisma.pbx_vars.findMany({
      select: {
        id: true,
        category: true,
        name: true,
        value: true,
        hostname: true,
        enabled: true,
        description: true,
      },
      orderBy: [
        { category: 'asc' },
        { sequence: 'asc' }
      ]
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch variables');
  }
}


export async function getVariable(id: string): Promise<Variable | null> {
  try {
    return await prisma.pbx_vars.findUnique({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch variable');
  }
}

export async function createVariable(input: VariableCreateInput): Promise<Variable> {
  try {
    return await prisma.pbx_vars.create({
      data: {
        ...VARIABLE_DEFAULTS,
        ...input,
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create variable');
  }
}

export async function updateVariable(
  id: string, 
  data: VariableUpdateInput
): Promise<Variable> {
  try {
    return await prisma.pbx_vars.update({
      where: { id },
      data: {
        ...data,
        updated: new Date(),
        updated_by: data.updated_by || 'system',
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update variable');
  }
}


export async function deleteVariable(id: string): Promise<void> {
  try {
    await prisma.pbx_vars.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete variable');
  }
}


export async function listTenants(): Promise<TenantDisplay[]> {
  try {
    return await prisma.auth_tenant.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        description: true,
        logo: true,
        plan: true,
        maxUsers: true,
        disabled: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tenants');
  }
}


export async function getTenant(id: string): Promise<Tenant | null> {
  try {
    return await prisma.auth_tenant.findUnique({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tenant');
  }
}

export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  try {
    return await prisma.auth_tenant.findUnique({
      where: { domain },
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tenant');
  }
}


export async function createTenant(input: TenantCreateInput): Promise<Tenant> {
  try {
    return await prisma.auth_tenant.create({
      data: {
        ...TENANT_DEFAULTS,
        ...input,
        accountId: input.id,
      },
      include: {
        users: true,
        pbxDomains: true
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create tenant');
  }
}


export async function updateTenant(
  id: string, 
  data: TenantUpdateInput
): Promise<Tenant> {
  try {
    return await prisma.auth_tenant.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update tenant');
  }
}


export async function deleteTenant(id: string): Promise<void> {
  try {
    await prisma.auth_tenant.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete tenant');
  }
}

export async function getTenantByUserId(tenantId: string): Promise<Tenant | null> {
  try {
    const tenant = await prisma.auth_tenant.findFirst({
      where: {
        name: tenantId
      },
      select: {
        id: true,
        accountId: true,
        name: true,
        domain: true,
        description: true,
        logo: true,
        plan: true,
        maxUsers: true,
        disabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return tenant;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tenant data');
  }
}


export async function getTenantByAccountId(accountId: string): Promise<Tenant | null> {
  try {
    const tenant = await prisma.auth_tenant.findUnique({
      where: {
        accountId: accountId
      },
      select: {
        id: true,
        accountId: true,
        name: true,
        domain: true,
        description: true,
        logo: true,
        plan: true,
        maxUsers: true,
        disabled: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return tenant;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tenant data');
  }
}