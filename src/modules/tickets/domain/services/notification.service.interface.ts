export interface TicketPurchasedNotification {
  userId: string;
  userEmail: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date | string;
  ticketId: string;
}

export interface NotificationService {
  sendTicketPurchasedNotification(
    data: TicketPurchasedNotification
  ): Promise<void>;
}


