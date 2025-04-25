'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { 
  createUserWithPbx, 
  verifyAuthUser,
  PbxdeleteUser, 
  PbxupdateUser,
  getPbxUser,
  getPbxUserByAccountId,
  getTenantByUserId,
  createTenant,
  createUserWithPbxOwnSchema,
  createUserWithPbxOwnSchemaFile,
} from '@/lib/db/queries'

import { 
  getUserDetailsByUid,
  createPbxExtension
 } from '@/lib/db/q'

import type { 
  FirebaseAuthUser, 
  SignUpResult,
  VerifyResult,
  AuthUserFull,
  PbxUserFull,
  PbxUserDisplay,
  DatabaseUserInput,
  PbxUserCreateInput,
  PbxUserUpdateInput,
  TenantCreateInput
} from "@/lib/db/types"

import { generateUniqueAccountId } from '@/lib/generate-account';

export async function generateNewAccountId(): Promise<string> {
  try {
    return await generateUniqueAccountId();
  } catch (error) {
    console.error('Error generating account ID:', error);
    throw new Error('Failed to generate account ID');
  }
}


export async function addExtension(formData: FormData) {
  try {
    // Get values from form data
    const extension = formData.get('extension')
    const password = formData.get('password')
    const description = formData.get('description')

    // Validate required fields
    if (!extension || !password) {
      throw new Error('Missing required fields')
    }

    // Get the current user's UID from the session or context
    // For this example, we'll need to pass it from the form
    const uid = formData.get('uid')
    if (!uid) {
      throw new Error('User authentication required')
    }

    // Create the extension using our multi-tenant aware function
    const newExtension = await createPbxExtension(uid.toString(), {
      extension: extension.toString(),
      password: password.toString(),
      description: description?.toString(),
    })

    // Revalidate the extensions page to show the new extension
    revalidatePath('/dashboard/ext-numbers/extensions')
    
    return { 
      success: true, 
      data: newExtension 
    }

  } catch (error) {
    console.error('Error adding extension:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add extension'
    }
  }
}



export async function createAuthPbxUser(
  firebaseUser: FirebaseAuthUser
): Promise<SignUpResult> {
  try {
    const verifyResult = await verifyAuthUser(
      firebaseUser.uid,
      firebaseUser.email
    );

    if (verifyResult.exists) {
      return {
        success: false,
        error: { message: 'User already exists' }
      };
    }

    
    const tenantData: TenantCreateInput = {
        accountId: firebaseUser.accountId,
        name: 'default',
        domain: 'vogat.lifesprintcare.ca',
        description: `Organization for ${firebaseUser.email}`,
        plan: 'basic',
        maxUsers: 5,
    };

    const authUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || null,
      avatar: firebaseUser.photoURL || null,
      phoneNumber: firebaseUser.phoneNumber || null,
      emailVerified: firebaseUser.emailVerified,
      tenantId: firebaseUser.tenantId,
      disabled: false,
      isAdmin: true,
      isSuperuser: false,
      isStaff: false,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      lastSignInAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now())
    };


    const pbxUserData = {
      username: firebaseUser.email.split('@')[0],
      email: firebaseUser.email,
    };


    const { authUser, pbxUser, tenant, domain } = await createUserWithPbxOwnSchemaFile(
      authUserData,
      pbxUserData,
      tenantData
    );


    return {
      success: true,
      data: {
        auth: authUser,
        pbx: pbxUser,
        tenant,
        domain
      }
    };

  } catch (error) {
    console.error('Error creating user:', error);
    

    return {
      success: false,
      error: {
        message: 'Failed to create user',
        code: 500
      }
    };
  }
}



export async function verifyAuthPbxUser(
  uid: string,
  tenantId: string
): Promise<VerifyResult> {
  try {
    const verifyResult = await verifyAuthUser(uid, tenantId);

    if (!verifyResult.exists || !verifyResult.user) {
      return {
        success: false,
        error: {
          message: 'User not found in system',
          code: 404
        }
      };
    }

    const { user } = verifyResult;

    if (verifyResult.error) {
      return {
        success: false,
        error: {
          message: verifyResult.error,
          code: 403
        }
      };
    }

    return {
      success: true,
      data: {
        auth: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          disabled: user.disabled,
          emailVerified: user.emailVerified,
          tenantId: user.tenantId
        },
        pbx: user.pbx_user ? {
          id: user.pbx_user.id,
          username: user.pbx_user.username,
          status: user.pbx_user.status,
          disabled: user.pbx_user.disabled
        } : undefined,
        tenant: user.tenant
      }
    };

  } catch (error) {
    console.error('Error verifying user:', error);

    return {
      success: false,
      error: {
        message: 'Failed to verify user',
        code: 500
      }
    };
  }
}



export async function toggleUserStatus(userId: bigint): Promise<{ 
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getPbxUser(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    await PbxupdateUser(userId, {
      disabled: !user.disabled,
      updatedBy: 'system'
    });

    revalidatePath('/dashboard/users');
    return { success: true };

  } catch (error) {
    console.error('Error toggling user status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle user status'
    };
  }
}

export async function deleteUser(userId: bigint): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await PbxdeleteUser(userId);
    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    };
  }
}

export async function createUser(input: DatabaseUserInput): Promise<{
  success: boolean;
  data?: {
    auth: any;
    pbx: PbxUserFull;
  };
  error?: string;
}> {
  try {
    const { authUser, pbxUser } = await createUserWithPbx(input);

    revalidatePath('/dashboard/users');
    return {
      success: true,
      data: {
        auth: authUser,
        pbx: pbxUser
      }
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
}

export async function updateUser(
  userId: bigint,
  data: PbxUserUpdateInput
): Promise<{
  success: boolean;
  data?: PbxUserFull;
  error?: string;
}> {
  try {
    const updatedUser = await PbxupdateUser(userId, {
      ...data,
      updatedBy: 'system'
    });

    revalidatePath('/dashboard/users');
    return {
      success: true,
      data: updatedUser
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    };
  }
}

export async function getPrimaryRole(uid: string): Promise<{
  success: boolean;
  role?: string;
  error?: string;
}> {
  try {
    const userDetails = await getUserDetailsByUid(uid);
    console.log('User details:', userDetails);

    if (!userDetails.authUser?.user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    let role = 'member';
    if (userDetails.authUser.user.isSuperuser) role = 'superuser';
    else if (userDetails.authUser.user.isAdmin) role = 'admin';
    else if (userDetails.authUser.user.isStaff) role = 'staff';

    return {
      success: true,
      role
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user role'
    };
  }
}

export async function getPbxUserByAccount(accountId: string): Promise<{
  success: boolean;
  data?: PbxUserFull;
  error?: string;
}> {
  try {
    const pbxUser = await getPbxUserByAccountId(accountId);
    
    if (!pbxUser) {
      return {
        success: false,
        error: 'No PBX user found for the given account ID'
      };
    }

    // Check if the associated auth_user exists and is not disabled
    if (!pbxUser.auth_user || pbxUser.auth_user.disabled) {
      return {
        success: false,
        error: 'Associated auth user is disabled or not found'
      };
    }

    return {
      success: true,
      data: pbxUser
    };
  } catch (error) {
    console.error('Error getting PBX user by account ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get PBX user by account ID'
    };
  }
}

export async function getPbxUsersByAccount(accountId: string): Promise<{
  success: boolean,
  data?: PbxUserFull[],
  error?: string
}> {
  try {
    const tenant = await prisma.auth_tenant.findUnique({
      where: { accountId },
      include: {
        users: {
          include: {
            pbx_users: {
              include: {
                auth_user: true
              }
            }
          }
        }
      }
    });
    
    if (!tenant) {
      return {
        success: false,
        error: 'Tenant not found for the given account ID'
      };
    }

    // Extract and map PBX users from all tenant users
    const pbxUsers = tenant.users
      .map(user => user.pbx_users)
      .filter((user): user is PbxUserFull => user !== null);

    return {
      success: true,
      data: pbxUsers
    };
  } catch (error) {
    console.error('Error getting PBX users by account ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get PBX users by account ID'
    };
  }
}

export async function getTenantData(tenantId: string): Promise<{
  success: boolean;
  data?: {
    accountId: string;
    name: string;
    domain: string;
    plan: string;
  };
  error?: string;
}> {
  try {
    const tenant = await getTenantByUserId(tenantId);
    
    if (!tenant) {
      return {
        success: false,
        error: 'Tenant not found'
      };
    }

    if (tenant.disabled) {
      return {
        success: false,
        error: 'Tenant is disabled'
      };
    }

    return {
      success: true,
      data: {
        accountId: tenant.accountId,
        name: tenant.name,
        domain: tenant.domain,
        plan: tenant.plan
      }
    };
  } catch (error) {
    console.error('Error getting tenant data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tenant data'
    };
  }
}