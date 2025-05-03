export async function logToFreeswitchConsole(level: string, message: string): Promise<void> {
    const realtimeVgtUrl = process.env.REALTIME_VGT_URL || 'http://localhost:8081'
  
    try {
      fetch(`${realtimeVgtUrl}/commands/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level, message }),
      }).catch(fetchError => {
        console.warn(`Failed to send log to realtime-vgt: ${fetchError}`);
      });
    } catch (error) {
       // Log errors locally
       console.warn(`Error preparing log request for realtime-vgt: ${error}`);
    }
    // Return immediately - don't wait for the fetch to complete
    return Promise.resolve();
  }