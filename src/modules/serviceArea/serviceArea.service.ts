import { ServiceAreaRepository } from './serviceArea.repository';
import { DriverRepository } from '../driver/driver.repository';
import { UpdateServiceAreaInput } from './serviceArea.schema';
import { AppError } from '../../utils/AppError';

export class ServiceAreaService {
  private serviceAreaRepo: ServiceAreaRepository;
  private driverRepo: DriverRepository;

  constructor() {
    this.serviceAreaRepo = new ServiceAreaRepository();
    this.driverRepo = new DriverRepository();
  }

  async updateServiceArea(driverId: string, input: UpdateServiceAreaInput) {
    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(`Driver not found with ID: ${driverId}`, 404, 'DRIVER_NOT_FOUND');
    }

    return this.serviceAreaRepo.upsert(driverId, input);
  }

  async getServiceArea(driverId: string) {
    const serviceArea = await this.serviceAreaRepo.findByDriverId(driverId);
    if (!serviceArea) {
      throw new AppError(`Service area not configured for Driver ID: ${driverId}`, 404, 'SERVICE_AREA_NOT_FOUND');
    }

    return serviceArea;
  }
}
