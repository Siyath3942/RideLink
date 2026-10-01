import { Request, Response, NextFunction } from 'express';
import { FareService } from '../services/fareService';

export class FareController {
  private service: FareService;

  constructor() {
    this.service = new FareService();
  }

  /**
   * POST /api/fares/estimate
   * Calculate and persist a fare estimate.
   */
  createEstimate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rideId, passengerId, distanceKm } = req.body;
      const estimate = await this.service.createEstimate(rideId, passengerId, distanceKm);

      res.status(201).json({
        success: true,
        message: 'Fare estimate calculated successfully',
        data: estimate,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/fares/estimate/:id
   * Retrieve a saved fare estimate.
   */
  getEstimateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const estimate = await this.service.getEstimateById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: estimate,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/fares/final
   * Calculate the final fare for a completed ride.
   */
  calculateFinalFare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rideId, passengerId, distanceKm } = req.body;
      const breakdown = await this.service.calculateFinalFare(rideId, distanceKm);

      res.status(200).json({
        success: true,
        message: 'Final fare calculated successfully',
        data: {
          rideId,
          passengerId,
          ...breakdown,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
