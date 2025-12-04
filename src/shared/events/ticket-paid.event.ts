export interface TicketPaidEvent {
  userEmail: string;
  eventTitle: string;
  ticketId: string;
  userName?: string;
  eventDate?: string;
}
