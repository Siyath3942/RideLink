import { Request, Response, NextFunction } from 'express';
import { VehicleService } from './vehicle.service';
import { DriverService } from '../driver/driver.service';
import { AppError } from '../../utils/AppError';

export class VehicleController {
  private service: VehicleService;
  private driverService: DriverService;

  constructor() {
    this.service = new VehicleService();
    this.driverService = new DriverService();
  }

  registerVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Authorization check: driver can only register vehicle for their own profile
      if (req.user && req.user.role === 'DRIVER') {
        const driver = await this.driverService.getDriverById(req.body.driverId);
        if (driver.accountId !== req.user.accountId) {
          throw new AppError('Unauthorized. You can only register a vehicle for your own driver profile.', 403, 'FORBIDDEN');
        }
      }

      const vehicle = await this.service.registerVehicle(req.body);
      res.status(201).json({
        success: true,
        message: 'Vehicle registered successfully',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicle = await this.service.getVehicleById(req.params.id);
      res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  getVehicleByDriverId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicle = await this.service.getVehicleByDriverId(req.params.driverId);
      res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Authorization check
      const vehicle = await this.service.getVehicleById(req.params.id);
      if (req.user && req.user.role === 'DRIVER') {
        if (vehicle.driver.accountId !== req.user.accountId) {
          throw new AppError('Unauthorized. You can only update your own vehicle.', 403, 'FORBIDDEN');
        }
      }

      const updated = await this.service.updateVehicle(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Vehicle details updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };
}
