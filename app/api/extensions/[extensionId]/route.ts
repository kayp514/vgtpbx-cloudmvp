import { NextResponse } from 'next/server';
import { auth } from '@tern-secure/nextjs/server'
import { DatabaseError, AuthorizationError } from '@/lib/errors'
import { getPbxExtension } from '@/lib/db/q'

interface RouteParams {
  params: {
    id: string
    extensionId: string
  }
}

export async function GET(request: Request, {
   params 
}: RouteParams) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!params.extensionId) {
      return NextResponse.json(
        { error: 'User ID and Extension ID are required' }, 
        { status: 400 }
      );
    }

    const uid = session.user.uid

    // Get specific extension by ID
    const extension = await getPbxExtension(uid, {
      id: params.extensionId
    });

    if (!extension) {
      return NextResponse.json(
        { error: 'Extension not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extension
    });

  } catch (error) {
    console.error('Error fetching extension:', error);
    
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
    );
  }
}