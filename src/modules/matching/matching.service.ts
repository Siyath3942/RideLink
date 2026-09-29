import { prisma } from '../../database/prisma';
import { EligibleDriversQueryInput } from './matching.schema';
import { calculateHaversineDistance } from '../../utils/haversine';

export interface EligibleDriverResult {
  driverId: string;
  accountId: string;
  licenseNumber: string;
  distanceKm: number;
  location: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
  vehicle: {
    id: string;
    registrationNumber: string;
    vehicleType: string;
    make: string;
    model: string;
    color: string;
    capacity: number;
  };
  serviceArea: {
    city: string;
    zoneName: string;
    radiusKm: number;
  };
}

export class MatchingService {
  async findEligibleDrivers(input: EligibleDriversQueryInput): Promise<EligibleDriverResult[]> {
    const now = new Date();

    // Query candidates matching basic availability and status constraints
    const candidates = await prisma.driver.findMany({
      where: {
        driverStatus: 'ACTIVE',
        availabilityStatus: 'AVAILABLE',
        licenseExpiry: {
          gt: now, // License must not be expired
        },
        vehicle: {
          isNot: null,
          vehicleStatus: 'APPROVED',
          capacity: {
            gte: input.requiredCapacity || 1,
          },
          ...(input.requiredVehicleType ? { vehicleType: input.requiredVehicleType } : {}),
        },
      },
      include: {
        vehicle: true,
        serviceArea: true,
        location: true,
      },
    });

    const eligibleDrivers: EligibleDriverResult[] = [];

    for (const driver of candidates) {
      if (!driver.vehicle) continue;

      // 1. Determine driver location coordinates (use location if available, fallback to serviceArea center)
      const driverLat = driver.location?.latitude ?? driver.serviceArea?.centerLatitude;
      const driverLon = driver.location?.longitude ?? driver.serviceArea?.centerLongitude;

      if (driverLat === undefined || driverLon === undefined) {
        continue; // Driver has no spatial coordinates set
      }

      // 2. Calculate distance between pickup and driver location using Haversine formula
      const distanceKm = calculateHaversineDistance(
        input.pickupLatitude,
        input.pickupLongitude,
        driverLat,
        driverLon
      );

      // 3. Service Area check: pickup point must be within driver's service area radius OR max search radius
      const maxAllowedRadius = driver.serviceArea?.radiusKm || input.maxSearchRadiusKm || 25.0;

      if (distanceKm <= maxAllowedRadius && distanceKm <= (input.maxSearchRadiusKm || 25.0)) {
        eligibleDrivers.push({
          driverId: driver.id,
          accountId: driver.accountId,
          licenseNumber: driver.licenseNumber,
          distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
          location: {
            latitude: driverLat,
            longitude: driverLon,
            lastUpdated: driver.location?.lastUpdated || driver.updatedAt,
          },
          vehicle: {
            id: driver.vehicle.id,
            registrationNumber: driver.vehicle.registrationNumber,
            vehicleType: driver.vehicle.vehicleType,
            make: driver.vehicle.make,
            model: driver.vehicle.model,
            color: driver.vehicle.color,
            capacity: driver.vehicle.capacity,
          },
          serviceArea: {
            city: driver.serviceArea?.city || 'Default City',
            zoneName: driver.serviceArea?.zoneName || 'General Zone',
            radiusKm: maxAllowedRadius,
          },
        });
      }
    }

    // Sort by closest distance first
    eligibleDrivers.sort((a, b) => a.distanceKm - b.distanceKm);

    return eligibleDrivers;
  }
}
