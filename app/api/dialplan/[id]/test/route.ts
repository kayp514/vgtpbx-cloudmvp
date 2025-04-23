import { NextResponse } from 'next/server';
import { auth} from '@tern-secure/nextjs/server';
import { getDialplanRule } from '@/lib/db/queries';

const tenantId = "default";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await auth();
    if (!user?.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rule = await getDialplanRule(params.id, tenantId);
    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Simulate an incoming call with test data
    const testNumber = '+15555551234'; // Example test number
    const matches = testNumber.match(new RegExp(rule.pattern));
    
    if (!matches) {
      return NextResponse.json({
        success: false,
        message: `Test number ${testNumber} does not match pattern ${rule.pattern}`
      });
    }

    // Test destination availability
    let destinationStatus = 'available';
    switch (rule.destinationType) {
      case 'EXTENSION':
        // Here you would check if extension is registered
        break;
      case 'RING_GROUP':
        // Check if ring group exists and has available members
        break;
      case 'IVR':
        // Check if IVR menu exists
        break;
      case 'VOICEMAIL':
        // Check if voicemail box exists
        break;
    }

    return NextResponse.json({
      success: true,
      message: `Call would route to ${rule.destinationType} (${rule.destination}). Destination status: ${destinationStatus}`,
      details: {
        testNumber,
        matches: matches.groups || matches,
        destination: {
          type: rule.destinationType,
          target: rule.destination,
          status: destinationStatus
        }
      }
    });

  } catch (error) {
    console.error('Error testing dialplan rule:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}