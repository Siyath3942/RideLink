import { Request, Response, NextFunction } from 'express';
import { ServiceAreaService } from './serviceArea.service';
import { DriverService } from '../driver/driver.service';
import { AppError } from '../../utils/AppError';

export class ServiceAreaController {
  private service: ServiceAreaService;
  private driverService: DriverService;

  constructor() {
    this.service = new ServiceAreaService();
    this.driverService = new DriverService();
  }

  updateServiceArea = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;

      if (req.user && req.user.role === 'DRIVER') {
        const driver = await this.driverService.getDriverById(driverId);
        if (driver.accountId !== req.user.accountId) {
          throw new AppError('Unauthorized. You can only update your own service area.', 403, 'FORBIDDEN');
        }
      }

      const serviceArea = await this.service.updateServiceArea(driverId, req.body);
      res.status(200).json({
        success: true,
        message: 'Driver service area updated successfully',
        data: serviceArea,
      });
    } catch (error) {
      next(error);
    }
  };

  getServiceArea = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverId } = req.params;
      const serviceArea = await this.service.getServiceArea(driverId);
      res.status(200).json({
        success: true,
        data: serviceArea,
      });
    } catch (error) {
      next(error);
    }
  };
}
