
import { CalendarEvent } from '../types';

const CLIENT_ID = '205773696373-g0jdh07sera0irm9a2bth4g1fc93vita.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

let tokenClient: any;

export const initGoogleAuth = () => {
  return new Promise<void>((resolve) => {
    // Fixed: Accessing 'google' on window which is not defined in standard Window type
    if (typeof (window as any).google === 'undefined') {
      const checkInterval = setInterval(() => {
        // Fixed: Accessing 'google' on window which is not defined in standard Window type
        if (typeof (window as any).google !== 'undefined') {
          clearInterval(checkInterval);
          setupClient(resolve);
        }
      }, 100);
    } else {
      setupClient(resolve);
    }
  });
};

const setupClient = (resolve: () => void) => {
  // Fixed: Accessing 'google' on window which is not defined in standard Window type
  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined at request time
  });
  resolve();
};

export const getAccessToken = () => {
  return new Promise<string>((resolve, reject) => {
    tokenClient.callback = (response: any) => {
      if (response.error !== undefined) {
        reject(response);
      }
      resolve(response.access_token);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const fetchUpcomingEvents = async (accessToken: string): Promise<CalendarEvent[]> => {
  const timeMin = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=10&orderBy=startTime&singleEvents=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Falha ao buscar eventos da agenda');
  }

  const data = await response.json();
  return data.items || [];
};

export const extractMeetingLink = (event: CalendarEvent): string | null => {
  if (event.hangoutLink) return event.hangoutLink;
  
  const searchString = `${event.location || ''} ${event.description || ''}`;
  const meetRegex = /https:\/\/meet\.google\.com\/[a-z0-9-]+/i;
  const zoomRegex = /https:\/\/[\w-]+\.zoom\.us\/j\/\d+/i;
  const teamsRegex = /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]+/i;

  const match = searchString.match(meetRegex) || searchString.match(zoomRegex) || searchString.match(teamsRegex);
  return match ? match[0] : null;
};
