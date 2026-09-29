import { prisma } from '../../database/prisma';
import { CreateDriverInput, UpdateDriverInput } from './driver.schema';

export class DriverRepository {
  async create(data: CreateDriverInput) {
    return prisma.driver.create({
      data: {
        accountId: data.accountId,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        driverStatus: data.driverStatus || 'ACTIVE',
        availabilityStatus: 'UNAVAILABLE',
      },
      include: {
        vehicle: true,
        serviceArea: true,
        location: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.driver.findUnique({
      where: { id },
      include: {
        vehicle: true,
        serviceArea: true,
        location: true,
      },
    });
  }

  async findByAccountId(accountId: string) {
    return prisma.driver.findUnique({
      where: { accountId },
      include: {
        vehicle: true,
        serviceArea: true,
        location: true,
      },
    });
  }

  async findByLicenseNumber(licenseNumber: string) {
    return prisma.driver.findUnique({
      where: { licenseNumber },
    });
  }

  async findAll(filter: { driverStatus?: string; availabilityStatus?: string }) {
    return prisma.driver.findMany({
      where: filter,
      include: {
        vehicle: true,
        serviceArea: true,
        location: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<UpdateDriverInput> & { availabilityStatus?: string }) {
    const updateData: any = {};
    if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
    if (data.licenseExpiry !== undefined) updateData.licenseExpiry = new Date(data.licenseExpiry);
    if (data.driverStatus !== undefined) updateData.driverStatus = data.driverStatus;
    if (data.availabilityStatus !== undefined) updateData.availabilityStatus = data.availabilityStatus;

    return prisma.driver.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        serviceArea: true,
        location: true,
      },
    });
  }
}
