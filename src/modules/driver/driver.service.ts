import { DriverRepository } from './driver.repository';
import { CreateDriverInput, UpdateDriverInput, UpdateDriverStatusInput } from './driver.schema';
import { AppError } from '../../utils/AppError';

export class DriverService {
  private repo: DriverRepository;

  constructor() {
    this.repo = new DriverRepository();
  }

  async createDriver(input: CreateDriverInput) {
    // Check if driver profile already exists for this account
    const existingByAccount = await this.repo.findByAccountId(input.accountId);
    if (existingByAccount) {
      throw new AppError(`Driver operational profile already exists for accountId: ${input.accountId}`, 409, 'DUPLICATE_DRIVER');
    }

    // Check if license number is already registered
    const existingByLicense = await this.repo.findByLicenseNumber(input.licenseNumber);
    if (existingByLicense) {
      throw new AppError(`License number '${input.licenseNumber}' is already registered`, 409, 'DUPLICATE_LICENSE');
    }

    // Validate license expiry date
    const expiryDate = new Date(input.licenseExpiry);
    if (expiryDate <= new Date()) {
      throw new AppError('Driver license has expired', 400, 'EXPIRED_LICENSE');
    }

    return this.repo.create(input);
  }

  async getDriverById(id: string) {
    const driver = await this.repo.findById(id);
    if (!driver) {
      throw new AppError(`Driver not found with ID: ${id}`, 404, 'DRIVER_NOT_FOUND');
    }
    return driver;
  }

  async getDriverByAccountId(accountId: string) {
    const driver = await this.repo.findByAccountId(accountId);
    if (!driver) {
      throw new AppError(`Driver profile not found for Account ID: ${accountId}`, 404, 'DRIVER_NOT_FOUND');
    }
    return driver;
  }

  async getAllDrivers(filter: { driverStatus?: string; availabilityStatus?: string }) {
    return this.repo.findAll(filter);
  }

  async updateDriver(id: string, input: UpdateDriverInput) {
    await this.getDriverById(id); // Ensure driver exists

    if (input.licenseNumber) {
      const existingByLicense = await this.repo.findByLicenseNumber(input.licenseNumber);
      if (existingByLicense && existingByLicense.id !== id) {
        throw new AppError(`License number '${input.licenseNumber}' is already registered to another driver`, 409, 'DUPLICATE_LICENSE');
      }
    }

    if (input.licenseExpiry) {
      const expiryDate = new Date(input.licenseExpiry);
      if (expiryDate <= new Date()) {
        throw new AppError('Driver license has expired', 400, 'EXPIRED_LICENSE');
      }
    }

    // If changing driverStatus to INACTIVE or SUSPENDED, force availability to UNAVAILABLE
    let availabilityStatus: string | undefined;
    if (input.driverStatus && input.driverStatus !== 'ACTIVE') {
      availabilityStatus = 'UNAVAILABLE';
    }

    return this.repo.update(id, {
      ...input,
      availabilityStatus,
    });
  }

  async updateDriverStatus(id: string, input: UpdateDriverStatusInput) {
    const driver = await this.getDriverById(id);

    let availabilityStatus = driver.availabilityStatus;
    // If status is changed to INACTIVE or SUSPENDED, revoke availability
    if (input.status !== 'ACTIVE') {
      availabilityStatus = 'UNAVAILABLE';
    }

    return this.repo.update(id, {
      driverStatus: input.status,
      availabilityStatus,
    });
  }
}
