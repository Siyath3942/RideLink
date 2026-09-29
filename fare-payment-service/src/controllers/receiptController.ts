import { Request, Response, NextFunction } from 'express';
import { ReceiptService } from '../services/receiptService';

export class ReceiptController {
  private service: ReceiptService;

  constructor() {
    this.service = new ReceiptService();
  }

  /**
   * GET /api/receipts/:id
   * Retrieve a receipt by its ID.
   */
  getReceiptById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const receipt = await this.service.getReceiptById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/receipts/ride/:rideId
   * Retrieve the receipt associated with a ride.
   */
  getReceiptByRideId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const receipt = await this.service.getReceiptByRideId(req.params.rideId as string);

      res.status(200).json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  };
}
