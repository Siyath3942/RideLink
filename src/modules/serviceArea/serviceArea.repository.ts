import { prisma } from '../../database/prisma';
import { UpdateServiceAreaInput } from './serviceArea.schema';

export class ServiceAreaRepository {
  async upsert(driverId: string, data: UpdateServiceAreaInput) {
    return prisma.serviceArea.upsert({
      where: { driverId },
      update: {
        city: data.city,
        zoneName: data.zoneName,
        centerLatitude: data.centerLatitude,
        centerLongitude: data.centerLongitude,
        radiusKm: data.radiusKm || 15.0,
      },
      create: {
        driverId,
        city: data.city,
        zoneName: data.zoneName,
        centerLatitude: data.centerLatitude,
        centerLongitude: data.centerLongitude,
        radiusKm: data.radiusKm || 15.0,
      },
      include: {
        driver: true,
      },
    });
  }

  async findByDriverId(driverId: string) {
    return prisma.serviceArea.findUnique({
      where: { driverId },
      include: {
        driver: true,
      },
    });
  }
}
