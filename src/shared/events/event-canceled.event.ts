export interface EventCanceledEvent {
  eventId: string;
  eventTitle: string;
  reason?: string;
  affectedUserEmails: string[];
}
