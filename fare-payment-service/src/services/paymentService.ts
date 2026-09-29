import { prisma } from '../database/prisma';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

export type PaymentMethod = 'CASH' | 'CARD' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export class PaymentService {
  /**
   * Create a simulated payment for a ride.
   * If `simulateFailure` is true the payment will be recorded as FAILED.
   * A receipt is generated only for successful payments.
   */
  async createPayment(
    rideId: string,
    passengerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    simulateFailure: boolean = false
  ) {
    const transactionReference = `TXN-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`;

    const status: PaymentStatus = simulateFailure ? 'FAILED' : 'SUCCESS';

    const payment = await prisma.payment.create({
      data: {
        rideId,
        passengerId,
        amount,
        paymentMethod,
        status,
        transactionReference,
      },
    });

    // Generate receipt only for successful payments
    let receipt = null;
    if (status === 'SUCCESS') {
      receipt = await prisma.receipt.create({
        data: {
          paymentId: payment.id,
          rideId,
          passengerId,
          amount,
          currency: 'LKR',
          paymentMethod,
        },
      });
    }

    return { payment, receipt };
  }

  /**
   * Get payment by its ID, including receipt if present.
   */
  async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { receipt: true },
    });
    if (!payment) {
      throw new AppError('Payment not found.', 404, 'PAYMENT_NOT_FOUND');
    }
    return payment;
  }

  /**
   * Get payment(s) for a specific ride.
   */
  async getPaymentsByRideId(rideId: string) {
    const payments = await prisma.payment.findMany({
      where: { rideId },
      include: { receipt: true },
      orderBy: { createdAt: 'desc' },
    });
    return payments;
  }

  /**
   * Get payment history for a specific passenger.
   */
  async getPaymentsByPassengerId(passengerId: string) {
    const payments = await prisma.payment.findMany({
      where: { passengerId },
      include: { receipt: true },
      orderBy: { createdAt: 'desc' },
    });
    return payments;
  }
}
