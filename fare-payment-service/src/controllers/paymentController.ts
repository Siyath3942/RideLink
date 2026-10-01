import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';

export class PaymentController {
  private service: PaymentService;

  constructor() {
    this.service = new PaymentService();
  }

  /**
   * POST /api/payments
   * Create a simulated payment for a ride.
   */
  createPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rideId, passengerId, amount, paymentMethod, simulateFailure } = req.body;
      const result = await this.service.createPayment(rideId, passengerId, amount, paymentMethod, simulateFailure);

      const statusCode = result.payment.status === 'SUCCESS' ? 201 : 200;

      res.status(statusCode).json({
        success: true,
        message: result.payment.status === 'SUCCESS'
          ? 'Payment processed successfully'
          : 'Payment processing failed (simulated failure)',
        data: {
          payment: result.payment,
          receipt: result.receipt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/payments/:id
   * Retrieve payment details by payment ID.
   */
  getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.service.getPaymentById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/payments/ride/:rideId
   * Retrieve payment details for a particular ride.
   */
  getPaymentsByRideId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await this.service.getPaymentsByRideId(req.params.rideId as string);

      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/payments/passenger/:passengerId
   * Retrieve payment history for a passenger.
   */
  getPaymentsByPassengerId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await this.service.getPaymentsByPassengerId(req.params.passengerId as string);

      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  };
}
