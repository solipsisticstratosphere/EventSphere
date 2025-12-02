import { Injectable } from '@nestjs/common';
import { PaymentService, PaymentResult } from '../../domain/services/payment.service.interface';

@Injectable()
export class SimulatedPaymentService implements PaymentService {
  async processPayment(): Promise<PaymentResult> {
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




