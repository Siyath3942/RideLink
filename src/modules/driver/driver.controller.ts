import { Request, Response, NextFunction } from 'express';
import { DriverService } from './driver.service';
import { AppError } from '../../utils/AppError';

export class DriverController {
  private service: DriverService;

  constructor() {
    this.service = new DriverService();
  }

  createDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Security check: driver can only create their own profile unless admin
      if (req.user && req.user.role === 'DRIVER' && req.user.accountId !== req.body.accountId) {
        throw new AppError('Unauthorized. You can only create an operational profile for your own account.', 403, 'FORBIDDEN');
      }

      const driver = await this.service.createDriver(req.body);
      res.status(201).json({
        success: true,
        message: 'Driver operational profile created successfully',
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  };

  getDriverById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driver = await this.service.getDriverById(req.params.id);
      res.status(200).json({
        success: true,
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  };

  getDriverByAccountId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driver = await this.service.getDriverByAccountId(req.params.accountId);
      res.status(200).json({
        success: true,
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { driverStatus, availabilityStatus } = req.query;
      const drivers = await this.service.getAllDrivers({
        driverStatus: driverStatus as string | undefined,
        availabilityStatus: availabilityStatus as string | undefined,
      });
      res.status(200).json({
        success: true,
        count: drivers.length,
        data: drivers,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Authorization check: driver can only update their own profile unless admin
      const driver = await this.service.getDriverById(req.params.id);
      if (req.user && req.user.role === 'DRIVER' && req.user.accountId !== driver.accountId) {
        throw new AppError('Unauthorized. You can only update your own driver profile.', 403, 'FORBIDDEN');
      }

      const updated = await this.service.updateDriver(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Driver profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDriverStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.service.updateDriverStatus(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: `Driver status updated to '${req.body.status}' successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };
}
