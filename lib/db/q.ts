import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { AuthUserFull, PbxUserFull } from '@/lib/db/types';

BigInt.prototype.toJSON = function() {
    return this.toString();
};

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
 * Verify if a user exists and get their basic information
 */
export async function verifyAuthUser(uid: string, email: string) {
  try {
    const serMapping = await prisma.auth_user_mapping.findFirst({
      where: {
        OR: [
          { uid },
          { user: { email } }
        ]
      },
      include: {
        user: true,
        tenant: {
          select: {
            id: true,
            accountId: true,
            name: true,
            domain: true
          }
        }
      }
    });

    return {
      exists: !!userMapping,
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