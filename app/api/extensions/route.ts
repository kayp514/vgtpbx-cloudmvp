import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@tern-secure/nextjs/server';
import { getPbxExtensions } from '@/lib/db/q';

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const uid = session.user.uid

    // Get params from URL if needed
    const searchParams = request.nextUrl.searchParams;
    const extensionId = searchParams.get('id');
    const extensionNumber = searchParams.get('extension');
    const includeDisabled = searchParams.get('includeDisabled') === 'true';

    // Get extensions with proper tenant isolation using uid
    const extensions = await getPbxExtensions(uid, {
      extensionId: extensionId || undefined,
      extension: extensionNumber || undefined,
      includeDisabled
    });

    return NextResponse.json({
      success: true,
      data: extensions
    });

  } catch (error) {
    console.error('Error in extensions route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}