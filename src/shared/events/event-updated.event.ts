export interface EventUpdatedEvent {
  eventId: string;
  eventTitle: string;
  changes: string[];
  affectedUserEmails: string[];
}
