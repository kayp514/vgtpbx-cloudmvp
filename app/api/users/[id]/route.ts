import { NextResponse } from 'next/server';
import { auth } from '@tern-secure/nextjs/server'
import { DatabaseError, AuthorizationError } from '@/lib/errors'
import { 
  getUserDetailsByUid, 
  getPbxUserDetails 
} from '@/lib/db/q'



export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {

    if (!params.uid) {
      return NextResponse.json(
        { error: 'Extension ID is required' }, 
        { status: 400 }
      );
    }

    const userDetails = await getUserDetailsByUid(params.uid)
    if (!userDetails) {
      throw new DatabaseError('User details not found')
    }

    const pbxUser = await getPbxUserDetails(params.uid)
    if (!pbxUser) {
      throw new DatabaseError('PBX user not found')
    }

    return NextResponse.json({
      success: true,
      data: {
        authUser: userDetails.authUser,
        tenant: userDetails.tenant,
        pbxUser,
        schemaName: userDetails.schemaName
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
