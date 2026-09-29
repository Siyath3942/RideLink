import { prisma } from '../../database/prisma';
import { UpdateLocationInput } from './location.schema';

export class LocationRepository {
  async upsert(driverId: string, data: UpdateLocationInput) {
    return prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading ?? 0.0,
        lastUpdated: new Date(),
      },
      create: {
        driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading ?? 0.0,
      },
      include: {
        driver: true,
      },
    });
  }

  async findByDriverId(driverId: string) {
    return prisma.driverLocation.findUnique({
      where: { driverId },
      include: {
        driver: true,
      },
    });
  }
}
