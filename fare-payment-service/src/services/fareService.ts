import { prisma } from '../database/prisma';
import { calculateFare, FareBreakdown } from './fareCalculator';
import { AppError } from '../utils/AppError';
import { rideServiceClient } from './rideServiceClient';

export class FareService {
  /**
   * Calculate and persist a fare estimate.
   */
  async createEstimate(rideId: string, passengerId: string, distanceKm: number) {
    const breakdown = calculateFare(distanceKm);

    const estimate = await prisma.fareEstimate.create({
      data: {
        rideId,
        passengerId,
        distanceKm: breakdown.distanceKm,
        baseFare: breakdown.baseFare,
        distanceFare: breakdown.distanceFare,
        bookingFee: breakdown.bookingFee,
        totalFare: breakdown.totalFare,
        currency: breakdown.currency,
      },
    });

    return estimate;
  }

  /**
   * Retrieve a fare estimate by ID.
   */
  async getEstimateById(id: string) {
    const estimate = await prisma.fareEstimate.findUnique({ where: { id } });
    if (!estimate) {
      throw new AppError('Fare estimate not found.', 404, 'FARE_ESTIMATE_NOT_FOUND');
    }
    return estimate;
  }

  /**
   * Calculate the final fare for a completed ride.
   * If distanceKm is provided, it uses it directly; otherwise it attempts
   * inter-service retrieval from Ride Management Service.
   */
  async calculateFinalFare(rideId: string, distanceKm?: number): Promise<FareBreakdown> {
    let resolvedDistance = distanceKm;
    if (resolvedDistance === undefined || resolvedDistance === null) {
      const rideInfo = await rideServiceClient.getRideDetails(rideId);
      if (rideInfo?.actualDistanceKm) {
        resolvedDistance = rideInfo.actualDistanceKm;
      }
    }

    if (resolvedDistance === undefined || resolvedDistance === null || resolvedDistance <= 0) {
      throw new AppError('Valid positive distanceKm is required for final fare calculation.', 400, 'INVALID_DISTANCE');
    }

    return calculateFare(resolvedDistance);
  }
}
