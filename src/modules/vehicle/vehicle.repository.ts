import { prisma } from '../../database/prisma';
import { RegisterVehicleInput, UpdateVehicleInput } from './vehicle.schema';

export class VehicleRepository {
  async create(data: RegisterVehicleInput) {
    return prisma.vehicle.create({
      data: {
        driverId: data.driverId,
        registrationNumber: data.registrationNumber,
        vehicleType: data.vehicleType,
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        capacity: data.capacity,
        vehicleStatus: data.vehicleStatus || 'APPROVED',
      },
      include: {
        driver: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: true,
      },
    });
  }

  async findByDriverId(driverId: string) {
    return prisma.vehicle.findUnique({
      where: { driverId },
      include: {
        driver: true,
      },
    });
  }

  async findByRegistrationNumber(registrationNumber: string) {
    return prisma.vehicle.findUnique({
      where: { registrationNumber },
    });
  }

  async update(id: string, data: UpdateVehicleInput) {
    return prisma.vehicle.update({
      where: { id },
      data,
      include: {
        driver: true,
      },
    });
  }
}
