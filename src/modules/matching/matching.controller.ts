import { Request, Response, NextFunction } from 'express';
import { MatchingService } from './matching.service';

export class MatchingController {
  private service: MatchingService;

  constructor() {
    this.service = new MatchingService();
  }

  getEligibleDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eligibleDrivers = await this.service.findEligibleDrivers(req.body);

      res.status(200).json({
        success: true,
        count: eligibleDrivers.length,
        message:
          eligibleDrivers.length > 0
            ? `Found ${eligibleDrivers.length} eligible available driver(s)`
            : 'No eligible drivers found matching the ride request criteria',
        data: eligibleDrivers,
      });
    } catch (error) {
      next(error);
    }
  };
}
