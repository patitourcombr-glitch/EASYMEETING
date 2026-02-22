
export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: string;
  videoUrl?: string;
  summary: string;
  bullets: string[];
  completedBullets?: number[]; // Índices dos bullet points marcados como concluídos
  transcript?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  hangoutLink?: string;
  htmlLink?: string; // Link oficial do Google para visualizar o evento
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export enum AppView {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  RECORDING = 'recording',
  MEETING_DETAILS = 'details',
  CALENDAR = 'calendar'
}
