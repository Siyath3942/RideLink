import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from './availability.service';
import { DriverService } from '../driver/driver.service';
import { AppError } from '../../utils/AppError';

export class AvailabilityController {
  private service: AvailabilityService;
  private driverService: DriverService;

  constructor() {
    this.service = new AvailabilityService();
    this.driverService = new DriverService();
  }

  updateAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;

      // Authorization: Driver can only update their own availability unless request is from Admin or Internal Microservice
      if (req.user && req.user.role === 'DRIVER' && !req.isInternalService) {
        const driver = await this.driverService.getDriverById(driverId);
        if (driver.accountId !== req.user.accountId) {
          throw new AppError('Unauthorized. You can only update your own availability status.', 403, 'FORBIDDEN');
        }
      }

      const updated = await this.service.updateAvailability(driverId, req.body);
      res.status(200).json({
        success: true,
        message: `Driver availability updated to '${req.body.availabilityStatus}' successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;
      const data = await this.service.getAvailability(driverId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
