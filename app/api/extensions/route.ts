import { NextResponse } from 'next/server';
import { auth } from '@tern-secure/nextjs/server'
import { DatabaseError, AuthorizationError } from '@/lib/errors'
import { getPbxExtensions } from '@/lib/db/q'

export async function GET(
  request: Request
) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const uid = session.user.uid


    // Get all extensions for the user, including disabled ones
    const extensions = await getPbxExtensions(uid, {
      includeDisabled: true
    });

    return NextResponse.json({
      success: true,
      data: extensions
    });

  } catch (error) {
    console.error('Error fetching user extensions:', error);
    
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