import { prisma } from '../database/prisma';
import { calculateFare, FareBreakdown } from './fareCalculator';
import { AppError } from '../utils/AppError';

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
   * Returns only the breakdown; does not persist (the payment handles persistence).
   */
  calculateFinalFare(distanceKm: number): FareBreakdown {
    return calculateFare(distanceKm);
  }
}
