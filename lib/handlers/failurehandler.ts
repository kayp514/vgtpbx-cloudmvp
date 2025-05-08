import { NextResponse } from 'next/server'
import { HttpApiResponse, FreeswitchEventData } from '@/lib/handlers/types'
import { prisma } from '@/lib/prisma';
import { logToFreeswitchConsole } from '@/lib/switchLogger';

interface FailureHandlerResponse {
  status: string;
  actions: {
    command: string;
    data: string;
  }[];
}

export async function handleFailure(eventData: FreeswitchEventData): Promise<NextResponse<HttpApiResponse>> {
  const {
    variable_originate_disposition: originateDisposition,
    variable_dialed_extension: dialedExtension,
    variable_domain_name: domainName,
    Caller_Context: context,
    variable_last_busy_dialed_extension: lastBusyDialedExtension,
    variable_forward_busy_enabled: forwardBusyEnabled,
    variable_forward_busy_destination: forwardBusyDestination,
    variable_forward_no_answer_enabled: forwardNoAnswerEnabled,
    variable_forward_no_answer_destination: forwardNoAnswerDestination,
    variable_forward_user_not_registered_enabled: forwardUserNotRegisteredEnabled,
    variable_forward_user_not_registered_destination: forwardUserNotRegisteredDestination,
    variable_missed_call_app: missedCallApp,
    variable_missed_call_data: missedCallData,
  } = eventData;

  // Use the domain from context if not provided
  const effectiveContext = context || domainName;

  try {
    const actions: FailureHandlerResponse['actions'] = [];

    switch(originateDisposition) {
      case 'USER_BUSY':
        // Handle USER_BUSY
        if (dialedExtension && lastBusyDialedExtension && dialedExtension !== lastBusyDialedExtension) {
          if (forwardBusyEnabled === 'true' && forwardBusyDestination) {
            actions.push(
              { 
                command: 'set',
                data: `last_busy_dialed_extension=${dialedExtension}`
              },
              {
                command: 'log',
                data: `NOTICE Forwarding on busy to: ${forwardBusyDestination}`
              },
              {
                command: 'transfer',
                data: `${forwardBusyDestination} XML ${effectiveContext}`
              }
            );
          } else {
            actions.push(
              {
                command: 'log',
                data: 'NOTICE Forwarding on busy with empty destination: hangup(USER_BUSY)'
              },
              {
                command: 'hangup',
                data: 'USER_BUSY'
              }
            );
          }
        }
        break;

      case 'NO_ANSWER':
      case 'ALLOTTED_TIMEOUT':
        // Handle NO_ANSWER
        if (forwardNoAnswerEnabled === 'true' && forwardNoAnswerDestination) {
          actions.push(
            {
              command: 'log',
              data: `NOTICE Forwarding on no answer to: ${forwardNoAnswerDestination}`
            },
            {
              command: 'transfer',
              data: `${forwardNoAnswerDestination} XML ${effectiveContext}`
            }
          );
        } else {
          actions.push(
            {
              command: 'log',
              data: 'NOTICE Forwarding on no answer with empty destination: hangup(NO_ANSWER)'
            },
            {
              command: 'hangup',
              data: 'NO_ANSWER'
            }
          );
        }
        break;

      case 'USER_NOT_REGISTERED':
        // Handle USER_NOT_REGISTERED
        if (forwardUserNotRegisteredEnabled === 'true' && forwardUserNotRegisteredDestination) {
          actions.push(
            {
              command: 'log',
              data: `NOTICE Forwarding on not registered to: ${forwardUserNotRegisteredDestination}`
            },
            {
              command: 'transfer',
              data: `${forwardUserNotRegisteredDestination} XML ${effectiveContext}`
            }
          );
        } else {
          actions.push(
            {
              command: 'log',
              data: 'NOTICE Forwarding on user not registered with empty destination: hangup(NO_ANSWER)'
            },
            {
              command: 'hangup',
              data: 'NO_ANSWER'
            }
          );
        }
        break;

      case 'SUBSCRIBER_ABSENT':
        // Handle SUBSCRIBER_ABSENT
        actions.push(
          {
            command: 'log',
            data: `NOTICE Subscriber absent: ${dialedExtension}`
          },
          {
            command: 'hangup',
            data: 'UNALLOCATED_NUMBER'
          }
        );
        break;

      case 'CALL_REJECTED':
        // Handle CALL_REJECTED
        actions.push(
          {
            command: 'log',
            data: 'NOTICE Call rejected'
          },
          {
            command: 'hangup',
            data: 'NORMAL_CLEARING'
          }
        );
        break;

      default:
        // Handle unknown disposition
        actions.push(
          {
            command: 'log',
            data: `NOTICE Unknown originate disposition: ${originateDisposition}`
          },
          {
            command: 'hangup',
            data: 'NORMAL_CLEARING'
          }
        );
    }

    // Handle missed call notifications if configured
    if (missedCallApp === 'email' && missedCallData) {
      try {
        // Log the missed call for debugging
        await logToFreeswitchConsole('INFO', `Processing missed call notification to: ${missedCallData}`);

        // TODO: Implement email notification using your preferred email service
        // This would typically involve:
        // 1. Fetching email template from database
        // 2. Formatting the email with call details
        // 3. Sending the email through your email service
      } catch (error) {
        await logToFreeswitchConsole('ERROR', `Failed to process missed call notification: ${error}`);
      }
    }

    return NextResponse.json({
      status: 'success',
      actions
    });

  } catch (error) {
    console.error('Failure handler error:', error);
    await logToFreeswitchConsole('ERROR', `Failure handler error: ${error}`);

    return NextResponse.json({
      status: 'error',
      actions: [
        {
          command: 'hangup',
          data: 'NORMAL_TEMPORARY_FAILURE'
        }
      ]
    });
  }
}