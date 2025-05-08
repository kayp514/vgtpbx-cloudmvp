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

export async function checkRegistration(user: string, domain: string): Promise<boolean> {
    const realtimeVgtUrl = process.env.REALTIME_VGT_URL || 'http://realtime-vgt';
    try {
        const response = await fetch(`${realtimeVgtUrl}/commands/registration/${encodeURIComponent(user)}/${encodeURIComponent(domain)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.warn(`Failed to check registration status: ${response.statusText}`);
            return false;
        }

        const data = await response.json();
        return data.registered === true;
    } catch (error) {
        console.error(`Error checking registration status: ${error}`);
        return false;
    }
}