export interface PaymentResult {
  success: boolean;
  message: string;
}

export interface PaymentService {
  processPayment(): Promise<PaymentResult>;
}




