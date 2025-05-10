import { type NextRequest, NextResponse } from 'next/server'
import { DatabaseError, AuthorizationError } from '@/lib/errors'
import { auth } from '@tern-secure/nextjs/server'
import { getUserDetailsByUid, updateUserDetails } from '@/lib/db/q'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { 
  params 
}: RouteParams) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const userDetails = await getUserDetailsByUid(params.id)
    
    if (!userDetails) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        authUser: userDetails.authUser,
        pbxUser: userDetails.pbxUser,
        schemaName: userDetails.schemaName
      }
    })

  } catch (error) {
    console.error('Error in user route:', error)

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const data = await request.json()
    
    const updatedUser = await updateUserDetails(params.id, data)

    return NextResponse.json({
      success: true,
      data: updatedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)

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
