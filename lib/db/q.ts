import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { 
  PbxUserFull, 
  Extension,
  ExtensionUser,
  ExtensionCreateInput,
  ExtensionUserCreateInput,
  AuthUserFull,
  PbxUserUpdateInput
} from '@/lib/db/types'
import { DatabaseError } from '@/lib/errors'
import crypto from 'crypto'

import { 
  DEFAULT_EXTENSION_VALUES as extensionDefaults,
  EXTENSION_USER_DEFAULTS as extensionUserDefaults
 } from '@/lib/db/types'


// Add proper type declaration for BigInt
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function() {
    return this.toString();
};

interface DialplanParams {
  callerContext: string;
  hostname: string;
  destinationNumber?: string;
  domainName?: string;
}


/**
 * Get user details from Firebase UID, including tenant and account information
 */
export async function getUserDetailsByUid(uid: string) {
  try {

    const authUserMapping = await prisma.auth_user_mapping.findUnique({
      where: { uid },
      include: {
        user: true, 
        tenant: true
      }
    });

    if (!authUserMapping) {
      throw new Error('User not found');
    }

    const pbxUser = await prisma.$queryRaw<PbxUserFull[]>`
      SELECT * FROM ${Prisma.raw(`"${authUserMapping.schemaName}"`)}."pbx_users"
      WHERE auth_user_id = ${uid}
      LIMIT 1
    `;

    return {
      authUser: authUserMapping,
      tenant: authUserMapping.tenant,
      pbxUser: pbxUser[0] || null,
      schemaName: authUserMapping.schemaName
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    throw new Error('Failed to get user details');
  }
}

/**
 * Get tenant and schema information from domain name (for FreeSWITCH)
 */
export async function getTenantInfoByDomain(fullDomain: string) {
    try {
      const domainMapping = await prisma.domain_mapping.findUnique({
        where: { fullDomain },
        include: {
          tenant: true
        }
      });
  
      if (!domainMapping) {
        throw new Error('Domain mapping not found');
      }
  
      return {
        tenantId: domainMapping.tenant.id,
        accountId: domainMapping.tenant.accountId,
        schemaName: `vgtpbx_${domainMapping.tenant.accountId}`,
        domain: domainMapping.tenant.domain
      };
    } catch (error) {
      console.error('Error getting tenant info from domain:', error);
      throw new Error('Failed to get tenant information');
    }
  }

/**
 * Verify if a user exists and get their basic information along with mapping details
 */
export async function verifyAuthUser(uid: string, email?: string) {
  try {
    const userMapping = await prisma.auth_user_mapping.findFirst({
      where: {
        OR: [
          { uid },
          { user: { email } }
        ]
      },
      include: {
        user: true,
        tenant: true
      }
    });

    return {
      exists: !!userMapping,
      mapping: userMapping ? {
        uid: userMapping.uid,
        accountId: userMapping.accountId,
        schemaName: userMapping.schemaName,
        tenantId: userMapping.tenantId,
        createdAt: userMapping.createdAt,
        updatedAt: userMapping.updatedAt
      } : null,
      user: userMapping?.user || null,
      tenant: userMapping?.tenant || null
    };
  } catch (error) {
    console.error('Error verifying user:', error);
    throw new Error('Failed to verify user');
  }
}


/**
 * Get PBX user details from schema
 */
export async function getPbxUserDetails(uid: string) {
  try {

    const userMapping = await prisma.auth_user_mapping.findUnique({
        where: { uid }
    });

    if (!userMapping) {
        throw new Error('User mapping not found');
    }

    const pbxUser = await prisma.$queryRaw<PbxUserFull[]>`
      SELECT * FROM ${Prisma.raw(`"${userMapping.schemaName}"`)}."pbx_users"
      WHERE auth_user_id = ${uid}
      LIMIT 1
    `;

    return pbxUser[0] || null;
  } catch (error) {
    console.error('Error getting PBX user details:', error);
    throw new Error('Failed to get PBX user details');
  }
}

/**
 * Combined function to get all user information
 */
export async function getFullUserInfo(uid: string) {
  try {

    const userMapping = await prisma.auth_user_mapping.findUnique({
        where: { uid },
        include: {
          user: true,
          tenant: true
        }
    });

    if (!userMapping) {
        throw new Error('User mapping not found');
    }
    

    // Get PBX user details from correct schema
    const pbxUser = await getPbxUserDetails(uid);

    return {
      authUser: userMapping.user,
      tenant: userMapping.tenant,
      pbxUser,
      schemaName: userMapping.schemaName
    };
  } catch (error) {
    console.error('Error getting full user info:', error);
    throw new Error('Failed to get user information');
  }
}

/**
 * Get PBX extensions with proper tenant isolation
 */
export async function getPbxExtensions(uid: string, options?: {
  extensionId?: string;
  extension?: string;
  domainUuid?: string; 
  includeDisabled?: boolean;
}) {
  try {
    // Get auth user mapping for tenant context
    const userMapping = await verifyAuthUser(uid);
    if (!userMapping.exists || !userMapping.mapping || !userMapping.tenant) {
      throw new Error('User mapping not found');
    }

    // Build the WHERE clause only with necessary conditions
    const whereConditions: string[] = [];
    
    if (options?.extensionId) {
      whereConditions.push(`e.id = '${options.extensionId}'`);
    }
    if (options?.domainUuid) {
      whereConditions.push(`e.domain_uuid = '${options.domainUuid}'`);
    }
    if (options?.extension) {
      whereConditions.push(`e.extension = '${options.extension}'`);
    }
    if (!options?.includeDisabled) {
      whereConditions.push('e.disabled = false');
    }

    // Only add WHERE clause if we have conditions
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Query extensions with schema-based tenant isolation
    const extensions = await prisma.$queryRaw<Extension[]>`
      SELECT 
        e.id,
        e.extension,
        e.effective_caller_id_name,
        e.effective_caller_id_number,
        e.call_group,
        e.user_context,
        e.disabled,
        e.directory_visible,
        e.directory_exten_visible,
        e.call_screen_enabled,
        e.do_not_disturb,
        e.forward_all_enabled,
        e.forward_busy_enabled,
        e.forward_no_answer_enabled,
        e.forward_user_not_registered_enabled,
        e.follow_me_enabled,
        e.force_ping,
        e.created,
        e.updated,
        e.updated_by,
        COALESCE(
          json_agg(
            json_build_object(
              'id', eu.id,
              'extension_uuid', eu.extension_uuid,
              'user_uuid', eu.user_uuid,
              'default_user', eu.default_user,
              'created', eu.created,
              'updated', eu.updated,
              'updated_by', eu.updated_by,
              'pbx_user', json_build_object(
                'user_uuid', pu.user_uuid,
                'username', pu.username,
                'auth_user', json_build_object(
                  'uid', au.uid,
                  'email', au.email
                )
              )
            )
          ) FILTER (WHERE eu.id IS NOT NULL),
          '[]'
        )::json as pbx_extension_users
      FROM ${Prisma.raw(`"${userMapping.mapping.schemaName}"`)}."pbx_extensions" e
      LEFT JOIN ${Prisma.raw(`"${userMapping.mapping.schemaName}"`)}."pbx_extension_users" eu 
        ON e.id = eu.extension_uuid
      LEFT JOIN ${Prisma.raw(`"${userMapping.mapping.schemaName}"`)}."pbx_users" pu 
        ON eu.user_uuid = pu.user_uuid
      LEFT JOIN "public"."auth_user" au 
        ON pu.auth_user_id = au.uid
      ${Prisma.raw(whereClause)}
      GROUP BY e.id
      ORDER BY e.extension ASC
    `;

    return extensions.map(ext => ({
      ...ext,
      pbx_extension_users: ext.pbx_extension_users || []
    }));

  } catch (error) {
    console.error('Error getting PBX extensions:', error);
    throw new Error('Failed to get PBX extensions');
  }
}

/**
 * Get a single PBX extension by ID or extension number
 */
export async function getPbxExtension(uid: string, identifier: { 
  id?: string;
  extension?: string;
}) {
  try {
    const extensions = await getPbxExtensions(uid, {
      extensionId: identifier.id,
      extension: identifier.extension,
      includeDisabled: true
    });

    return extensions[0] || null;
  } catch (error) {
    console.error('Error getting PBX extension:', error);
    throw new Error('Failed to get PBX extension');
  }
}

/**
 * Creates a new PBX extension with associated users
 */
export async function createPbxExtension(uid: string, input: ExtensionCreateInput): Promise<Extension> {
  try {
    // Get auth user mapping for tenant context
    const userMapping = await verifyAuthUser(uid);
    if (!userMapping.exists || !userMapping.mapping || !userMapping.tenant) {
      throw new Error('User mapping not found');
    }

    // Get the domain mapping for the tenant
    const domainMapping = await prisma.domain_mapping.findFirst({
      where: { tenantId: userMapping.tenant.id }
    });

    if (!domainMapping) {
      throw new Error('Domain mapping not found for tenant');
    }

    const schemaName = userMapping.mapping.schemaName;
    const now = new Date();
    const extensionId = crypto.randomUUID();

    // Create extension with all default values in the proper schema
    const [extension] = await prisma.$queryRaw<[Extension]>`
      INSERT INTO ${Prisma.raw(`"${schemaName}"`)}."pbx_extensions" (
        id,
        extension,
        password,
        domain_uuid,
        description,
        user_context,
        created,
        updated,
        updated_by,
        disabled,
        directory_visible,
        directory_exten_visible,
        call_screen_enabled,
        do_not_disturb,
        forward_all_enabled,
        forward_busy_enabled,
        forward_no_answer_enabled,
        forward_user_not_registered_enabled,
        follow_me_enabled,
        force_ping
      ) VALUES (
        ${extensionId}::uuid,
        ${input.extension},
        ${input.password},
        ${domainMapping.fullDomainUid}::uuid,
        ${input.description || null},
        ${domainMapping.fullDomain},
        ${now},
        ${now},
        ${extensionDefaults.updated_by},
        ${extensionDefaults.disabled},
        ${extensionDefaults.directory_visible},
        ${extensionDefaults.directory_exten_visible},
        ${extensionDefaults.call_screen_enabled},
        ${extensionDefaults.do_not_disturb},
        ${extensionDefaults.forward_all_enabled},
        ${extensionDefaults.forward_busy_enabled},
        ${extensionDefaults.forward_no_answer_enabled},
        ${extensionDefaults.forward_user_not_registered_enabled},
        ${extensionDefaults.follow_me_enabled},
        ${extensionDefaults.force_ping}
      )
      RETURNING *
    `;

    // If there are associated users, create the extension user mappings
    if (input.users && input.users.length > 0) {
      const extensionUsers = await Promise.all(
        input.users.map(async (user: ExtensionUserCreateInput) => {
          const [extensionUser] = await prisma.$queryRaw<[ExtensionUser]>`
            INSERT INTO ${Prisma.raw(`"${schemaName}"`)}."pbx_extension_users" (
              id,
              extension_uuid,
              user_uuid,
              default_user,
              created,
              updated,
              updated_by
            ) VALUES (
              ${crypto.randomUUID()}::uuid,
              ${extension.id}::uuid,
              ${user.user_uuid}::uuid,
              ${user.default_user},
              ${now},
              ${now},
              ${extensionUserDefaults.updated_by}
            )
            RETURNING *
          `;
          return extensionUser;
        })
      );

      // Return the created extension with its associated users
      return {
        ...extension,
        pbx_extension_users: extensionUsers
      };
    }

    // Return the created extension without users if none were provided
    return {
      ...extension,
      pbx_extension_users: []
    };

  } catch (error) {
    console.error('Error creating PBX extension:', error);
    throw new Error('Failed to create PBX extension');
  }
}


/**
 * Get extension details for FreeSWITCH directory lookup
 */
export async function getDirectoryExtension(extensionNumber: string, domain: string) {
  try {
    // Get domain mapping to find the correct tenant and schema
    const domainMapping = await prisma.domain_mapping.findFirst({
      where: { fullDomain: domain },
      include: {
        tenant: true
      }
    });

    if (!domainMapping) {
      throw new Error(`Domain not found: ${domain}`);
    }

    // Get schema name from tenant's accountId
    const schemaName = `vgtpbx_${domainMapping.tenant.accountId}`;

    // Query the extension from the correct schema
    const extension = await prisma.$queryRaw<any[]>`
      SELECT 
        e.id,
        e.extension,
        e.password,
        e.accountcode,
        e.user_context,
        e.effective_caller_id_name,
        e.effective_caller_id_number,
        e.outbound_caller_id_name,
        e.outbound_caller_id_number,
        e.emergency_caller_id_name,
        e.emergency_caller_id_number,
        e.directory_first_name,
        e.directory_last_name,
        e.directory_visible,
        e.directory_exten_visible,
        e.call_timeout,
        e.call_group,
        e.user_record,
        e.toll_allow,
        e.accountcode,
        e.forward_all_enabled,
        e.forward_all_destination,
        e.forward_busy_enabled,
        e.forward_busy_destination,
        e.forward_no_answer_enabled,
        e.forward_no_answer_destination,
        e.forward_user_not_registered_enabled,
        e.forward_user_not_registered_destination,
        e.follow_me_enabled,
        e.do_not_disturb,
        e.missed_call_app,
        e.missed_call_data,
        e.call_screen_enabled,
        e.limit_max,
        e.domain_uuid,
        d.name as domain_name
      FROM ${Prisma.raw(`"${schemaName}"`)}."pbx_extensions" e
      JOIN ${Prisma.raw(`"${schemaName}"`)}."pbx_domains" d 
        ON e.domain_uuid = d.id
      WHERE 
        e.extension = ${extensionNumber}
        AND e.disabled = false
        AND d.name = ${domain}
      LIMIT 1
    `;

    if (!extension || extension.length === 0) {
      return null;
    }

    return {
      ...extension[0],
      schemaName,
      tenantId: domainMapping.tenant.id
    };
  } catch (error) {
    console.error('Error getting directory extension:', error);
    throw new Error('Failed to get directory extension');
  }
}

/**
 * Update auth_user information
 */
export async function updateAuthUser(uid: string, data: any) {
  try {
    const userMapping = await prisma.auth_user_mapping.findUnique({
      where: { uid },
      include: {
        user: true,
      }
    });

    if (!userMapping) {
      throw new Error('User mapping not found');
    }

    // Update auth_user
    const updatedAuthUser = await prisma.auth_user.update({
      where: { uid: userMapping.user.uid },
      data: {
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        isAdmin: data.isAdmin,
        isSuperuser: data.isSuperuser,
        isStaff: data.isStaff,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      user: updatedAuthUser
    };
  } catch (error) {
    console.error('Error updating auth user:', error);
    throw new Error('Failed to update auth user');
  }
}

/**
 * Update PBX user information
 */
export async function updatePbxUser(uid: string, data: PbxUserUpdateInput) {
  try {
    const userMapping = await prisma.auth_user_mapping.findUnique({
      where: { uid },
      include: {
        tenant: true
      }
    });

    if (!userMapping) {
      throw new Error('User mapping not found');
    }

    // Update pbx_user in the tenant's schema
    const updatedPbxUser = await prisma.$queryRaw<PbxUserFull[]>`
      UPDATE ${Prisma.raw(`"${userMapping.schemaName}"`)}."pbx_users"
      SET 
        username = ${data.username || null},
        email = ${data.email || null},
        disabled = ${data.disabled || false},
        updated = CURRENT_TIMESTAMP,
        updated_by = ${uid}
      WHERE auth_user_id = ${uid}
      RETURNING *
    `;

    return {
      success: true,
      user: updatedPbxUser[0]
    };
  } catch (error) {
    console.error('Error updating PBX user:', error);
    throw new Error('Failed to update PBX user');
  }
}

/**
 * Update user details
 */
export async function updateUserDetails(uid: string, data: any) {
  try {
    const userMapping = await prisma.auth_user_mapping.findUnique({
      where: { uid },
      include: {
        user: true,
        tenant: true
      }
    });

    if (!userMapping) {
      throw new Error('User mapping not found');
    }

    // Start a transaction to update both auth_user and pbx_user
    const [updatedAuthUser, updatedPbxUser] = await prisma.$transaction([
      // Update auth_user
      prisma.auth_user.update({
        where: { uid: userMapping.user.uid },
        data: {
          displayName: data.auth_user?.displayName,
          firstName: data.auth_user?.firstName,
          lastName: data.auth_user?.lastName,
          isAdmin: data.auth_user?.isAdmin,
          isSuperuser: data.auth_user?.isSuperuser,
          isStaff: data.auth_user?.isStaff,
        },
      }),
      // Update pbx_user
      prisma.$queryRaw`
        UPDATE ${Prisma.raw(`"${userMapping.schemaName}"`)}."pbx_users"
        SET 
          username = ${data.username || null},
          email = ${data.email || null},
          status = ${data.status || null},
          disabled = ${data.disabled || false},
          department = ${data.department || null},
          updated = CURRENT_TIMESTAMP,
          updatedBy = ${uid}
        WHERE auth_user_id = ${uid}
        RETURNING *
      `
    ]);

    return {
      authUser: {
        user: updatedAuthUser
      },
      pbxUser: updatedPbxUser[0],
      schemaName: userMapping.schemaName
    };
  } catch (error) {
    console.error('Error updating user details:', error);
    throw new DatabaseError('Failed to update user details');
  }
}