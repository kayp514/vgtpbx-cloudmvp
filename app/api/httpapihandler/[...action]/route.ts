import { NextRequest, NextResponse } from 'next/server'
import { handleFailure } from '@/lib/handlers/failurehandler'
import { HttpApiResponse, FreeswitchEventData } from '@/lib/handlers/types'


export async function POST(
  request: NextRequest,
  { params }: { params: { action: string[] } }
) {
  try {
    const [action, ...subActions] = (await params).action;

    const formData = await request.formData();
    
    // Create eventData with all form fields
    let eventData: FreeswitchEventData = {};
    for (const [key, value] of formData.entries()) {
      if (value !== null && value !== undefined) {
        eventData[key] = value as string;
      }
    }

    // Log the incoming request for debugging
 //   console.log('HTTAPI Request:', {
 //     action,
//      subActions,
///      formData: Object.fromEntries(formData),
 //     eventData
//    });

    // Validate required data from httapi.conf.xml parameters
    if (!eventData.domain_name && !eventData.variable_domain_name) {
      throw new Error('Missing domain information');
    }

    // Handle different HTTAPI actions
    switch (action) {
      case 'followme':
        //TODO;
        //console.log('followme action received:', eventData);
        return NextResponse.json({
          status: 'not_implemented',
          actions: [
            {
              command: 'hangup',
              data: 'NORMAL_TEMPORARY_FAILURE'
            }
          ]
        });
      
      case 'voicemail':
        //TODO: Implement voicemail handling;
        //console.log('Voicemail action received:', eventData);
        return NextResponse.json({
          status: 'not_implemented',
          actions: [
            {
              command: 'hangup',
              data: 'NORMAL_TEMPORARY_FAILURE'
            }
          ]
        });
      
      case 'hangup':
        //TODO;
        //console.log('Hangup action received:', eventData);
        return NextResponse.json({
          status: 'success',
          actions: [
            {
              command: 'hangup',
              data: 'NORMAL_CLEARING'
            }
          ]
        });
      
      case 'failure':
        //console.log('Failure action received:', eventData);
        return handleFailure(eventData);
      
      case 'record':
        //ToDo
        //console.log('Record action received:', eventData);
        return NextResponse.json({
          status: 'not_implemented',
          actions: [
            {
              command: 'hangup',
              data: 'NORMAL_TEMPORARY_FAILURE'
            }
          ]
        });

      default:
        console.warn(`Unhandled HTTAPI action: ${action}`);
        return NextResponse.json({ 
          error: 'Unknown action',
          actions: [
            {
              command: 'hangup',
              data: 'NORMAL_TEMPORARY_FAILURE'
            }
          ]
        });
    }

  } catch (error) {
    console.error('Error in HTTAPI handler:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      actions: [
        {
          command: 'hangup',
          data: 'NORMAL_TEMPORARY_FAILURE'
        }
      ]
    }, { status: 500 });
  }
}