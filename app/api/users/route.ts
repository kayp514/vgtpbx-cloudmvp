import { type NextRequest, NextResponse } from 'next/server'
import { DatabaseError, AuthorizationError } from '@/lib/errors'
import { auth } from '@tern-secure/nextjs/server'
import { 
  getUserDetailsByUid, 
  getPbxUserDetails 
} from '@/lib/db/q'
import { NextApiRequest } from 'next'


export async function GET(request: NextApiRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const uid = session.user.uid

    const userDetails = await getUserDetailsByUid(uid)
    if (!userDetails) {
      //throw new DatabaseError('User details not found')
      return NextResponse.json(
        { success: false, error: "User details not found" },
        { status: 404 }
      )
    }

    const pbxUser = await getPbxUserDetails(uid)
    if (!pbxUser) {
      //throw new DatabaseError('PBX user not found')
      return NextResponse.json({ success: false, error: "PBX user not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        authUser: userDetails.authUser,
        pbxUser,
        schemaName: userDetails.schemaName
      }
    })
  } catch (error) {
    console.error('Error in users route:', error)

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
