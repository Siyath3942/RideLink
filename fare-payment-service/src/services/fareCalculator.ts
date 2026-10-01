import { fareConfig } from '../config';

export interface FareBreakdown {
  distanceKm: number;
  baseFare: number;
  distanceFare: number;
  bookingFee: number;
  totalFare: number;
  currency: string;
}

/**
 * Calculates a fare breakdown for a given distance.
 *
 * Formula:
 *   Distance Fare = Distance × Rate per Kilometer
 *   Total Fare    = Base Fare + Distance Fare + Booking Fee
 *   Final Fare    = max(Minimum Fare, Total Fare)
 */
export function calculateFare(distanceKm: number): FareBreakdown {
  const { baseFare, ratePerKm, bookingFee, minimumFare, currency } = fareConfig;

  const distanceFare = parseFloat((distanceKm * ratePerKm).toFixed(2));
  const rawTotal = parseFloat((baseFare + distanceFare + bookingFee).toFixed(2));
  const totalFare = Math.max(minimumFare, rawTotal);

  return {
    distanceKm,
    baseFare,
    distanceFare,
    bookingFee,
    totalFare,
    currency,
  };
}
