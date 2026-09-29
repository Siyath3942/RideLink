import { Request, Response, NextFunction } from 'express';
import { LocationService } from './location.service';
import { DriverService } from '../driver/driver.service';
import { AppError } from '../../utils/AppError';

export class LocationController {
  private service: LocationService;
  private driverService: DriverService;

  constructor() {
    this.service = new LocationService();
    this.driverService = new DriverService();
  }

  updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;

      if (req.user && req.user.role === 'DRIVER') {
        const driver = await this.driverService.getDriverById(driverId);
        if (driver.accountId !== req.user.accountId) {
          throw new AppError('Unauthorized. You can only update your own simulated location.', 403, 'FORBIDDEN');
        }
      }

      const location = await this.service.updateLocation(driverId, req.body);
      res.status(200).json({
        success: true,
        message: 'Driver location updated successfully',
        data: location,
      });
    } catch (error) {
      next(error);
    }
  };

  getLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;
      const location = await this.service.getLocation(driverId);
      res.status(200).json({
        success: true,
        data: location,
      });
    } catch (error) {
      next(error);
    }
  };
}
