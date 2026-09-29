import { DriverRepository } from '../driver/driver.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { UpdateAvailabilityInput } from './availability.schema';
import { AppError } from '../../utils/AppError';

export class AvailabilityService {
  private driverRepo: DriverRepository;
  private vehicleRepo: VehicleRepository;

  constructor() {
    this.driverRepo = new DriverRepository();
    this.vehicleRepo = new VehicleRepository();
  }

  async updateAvailability(driverId: string, input: UpdateAvailabilityInput) {
    // Rule 1: Driver must exist
    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(`Driver not found with ID: ${driverId}`, 404, 'DRIVER_NOT_FOUND');
    }

    const { availabilityStatus } = input;

    // Rule 2 & 3: Becoming AVAILABLE or ON_TRIP requires ACTIVE operational status and APPROVED vehicle
    if (availabilityStatus === 'AVAILABLE' || availabilityStatus === 'ON_TRIP') {
      // Check operational status
      if (driver.driverStatus !== 'ACTIVE') {
        throw new AppError(
          `Cannot set availability to '${availabilityStatus}'. Driver operational status is '${driver.driverStatus}'. Driver must be ACTIVE.`,
          422,
          'INACTIVE_DRIVER_CANNOT_BE_AVAILABLE'
        );
      }

      // Check vehicle requirement
      const vehicle = await this.vehicleRepo.findByDriverId(driverId);
      if (!vehicle) {
        throw new AppError(
          `Cannot set availability to '${availabilityStatus}'. Driver has no vehicle registered. A valid approved vehicle is required.`,
          422,
          'NO_VEHICLE_REGISTERED'
        );
      }

      if (vehicle.vehicleStatus !== 'APPROVED') {
        throw new AppError(
          `Cannot set availability to '${availabilityStatus}'. Registered vehicle status is '${vehicle.vehicleStatus}'. Vehicle must be APPROVED.`,
          422,
          'VEHICLE_NOT_APPROVED'
        );
      }
    }

    return this.driverRepo.update(driverId, {
      availabilityStatus,
    });
  }

  async getAvailability(driverId: string) {
    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(`Driver not found with ID: ${driverId}`, 404, 'DRIVER_NOT_FOUND');
    }

    return {
      driverId: driver.id,
      driverStatus: driver.driverStatus,
      availabilityStatus: driver.availabilityStatus,
      hasVehicle: !!driver.vehicle,
      vehicleStatus: driver.vehicle?.vehicleStatus || null,
    };
  }
}
