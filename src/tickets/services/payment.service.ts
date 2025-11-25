import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  async simulatePayment(): Promise<{ success: boolean; message: string }> {
    const delay = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const success = Math.random() < 0.9;

    return {
      success,
      message: success
        ? 'Payment processed successfully'
        : 'Payment failed - insufficient funds or card declined',
    };
  }
}
