import { LocationRepository } from './location.repository';
import { DriverRepository } from '../driver/driver.repository';
import { UpdateLocationInput } from './location.schema';
import { AppError } from '../../utils/AppError';

export class LocationService {
  private locationRepo: LocationRepository;
  private driverRepo: DriverRepository;

  constructor() {
    this.locationRepo = new LocationRepository();
    this.driverRepo = new DriverRepository();
  }

  async updateLocation(driverId: string, input: UpdateLocationInput) {
    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(`Driver not found with ID: ${driverId}`, 404, 'DRIVER_NOT_FOUND');
    }

    return this.locationRepo.upsert(driverId, input);
  }

  async getLocation(driverId: string) {
    const location = await this.locationRepo.findByDriverId(driverId);
    if (!location) {
      throw new AppError(`Location data not available for Driver ID: ${driverId}`, 404, 'LOCATION_NOT_FOUND');
    }

    return location;
  }
}
