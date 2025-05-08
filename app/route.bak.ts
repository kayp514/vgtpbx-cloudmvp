import { NextRequest, NextResponse } from 'next/server'


type FreeswitchEventPayload = {
  eventName: string
  eventData: Record<string, any>
  timestamp: string
}

interface CustomEvent extends FreeswitchEventPayload {
    subClass?: string
}


//const SHARED_SECRET = process.env.INTERNAL_API_SECRET || 'your-very-secret-key';

export async function POST(request: NextRequest) {
  // 1. Authenticate the request (ensure it's from vogat-eslserver)
  //const authorization = request.headers.get('Authorization');
  //if (authorization !== `Bearer ${SHARED_SECRET}`) {
  //  console.warn('Unauthorized attempt to access internal freeswitch-events API');
  //  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 // }

  try {
    const payload = await request.json() as CustomEvent
    const { eventName, eventData, subClass } = payload

    console.log(`Received internal event notification: ${eventName}`, eventData);

    // Process the event based on its name
    switch (eventName) {
      case 'CUSTOM':
        switch (subClass) {
            case 'sofia:register':
                console.log('Sofia register event received:', eventData);
                break;

            default:
                console.log(`Received unhandled custom event: ${subClass}`);
        }
        break;

      case 'CHANNEL_HANGUP':
        //todo
        break;
      case 'CHANNEL_ANSWER':
        //todo
        break;
      case 'CHANNEL_HANGUP':
        console.log('Channel hangup event received:', eventData);
        break;
      default:
        console.log(`Received unhandled event type: ${eventName}`);
    }

    // Respond to vogat-eslserver (usually just acknowledge receipt)
    return NextResponse.json({ success: true, message: 'Event received' }, { status: 200 });

  } catch (error) {
    console.error('Error processing internal freeswitch event:', error);
    return NextResponse.json({ error: 'Internal Server Error processing event' }, { status: 500 });
  }
}