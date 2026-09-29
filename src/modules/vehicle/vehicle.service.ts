import { VehicleRepository } from './vehicle.repository';
import { DriverRepository } from '../driver/driver.repository';
import { RegisterVehicleInput, UpdateVehicleInput } from './vehicle.schema';
import { AppError } from '../../utils/AppError';

export class VehicleService {
  private vehicleRepo: VehicleRepository;
  private driverRepo: DriverRepository;

  constructor() {
    this.vehicleRepo = new VehicleRepository();
    this.driverRepo = new DriverRepository();
  }

  async registerVehicle(input: RegisterVehicleInput) {
    // 1. Verify Driver exists
    const driver = await this.driverRepo.findById(input.driverId);
    if (!driver) {
      throw new AppError(`Cannot register vehicle. Driver not found with ID: ${input.driverId}`, 404, 'DRIVER_NOT_FOUND');
    }

    // 2. Check if driver already has a vehicle
    const existingVehicle = await this.vehicleRepo.findByDriverId(input.driverId);
    if (existingVehicle) {
      throw new AppError(`Driver ID '${input.driverId}' already has a vehicle registered.`, 409, 'DRIVER_VEHICLE_EXISTS');
    }

    // 3. Check for duplicate registration number
    const duplicateReg = await this.vehicleRepo.findByRegistrationNumber(input.registrationNumber);
    if (duplicateReg) {
      throw new AppError(`Vehicle registration number '${input.registrationNumber}' is already in use.`, 409, 'DUPLICATE_REGISTRATION');
    }

    return this.vehicleRepo.create(input);
  }

  async getVehicleById(id: string) {
    const vehicle = await this.vehicleRepo.findById(id);
    if (!vehicle) {
      throw new AppError(`Vehicle not found with ID: ${id}`, 404, 'VEHICLE_NOT_FOUND');
    }
    return vehicle;
  }

  async getVehicleByDriverId(driverId: string) {
    const vehicle = await this.vehicleRepo.findByDriverId(driverId);
    if (!vehicle) {
      throw new AppError(`No vehicle registered for Driver ID: ${driverId}`, 404, 'VEHICLE_NOT_FOUND');
    }
    return vehicle;
  }

  async updateVehicle(id: string, input: UpdateVehicleInput) {
    const existing = await this.getVehicleById(id);

    if (input.registrationNumber && input.registrationNumber !== existing.registrationNumber) {
      const duplicateReg = await this.vehicleRepo.findByRegistrationNumber(input.registrationNumber);
      if (duplicateReg && duplicateReg.id !== id) {
        throw new AppError(`Vehicle registration number '${input.registrationNumber}' is already in use.`, 409, 'DUPLICATE_REGISTRATION');
      }
    }

    return this.vehicleRepo.update(id, input);
  }
}
