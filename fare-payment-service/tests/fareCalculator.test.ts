import { describe, it, expect } from 'vitest';
import { calculateFare } from '../src/services/fareCalculator';

describe('Fare Calculator Unit Tests', () => {
  // Default values from config:
  // Base fare: 150 LKR
  // Rate per km: 80 LKR
  // Booking fee: 30 LKR
  // Minimum fare: 250 LKR

  it('should correctly calculate fare for standard distance (5 km)', () => {
    // Distance fare = 5 * 80 = 400
    // Total fare = 150 + 400 + 30 = 580
    const result = calculateFare(5);
    expect(result.distanceKm).toBe(5);
    expect(result.baseFare).toBe(150);
    expect(result.distanceFare).toBe(400);
    expect(result.bookingFee).toBe(30);
    expect(result.totalFare).toBe(580);
    expect(result.currency).toBe('LKR');
  });

  it('should correctly calculate fare for short distance and enforce minimum fare (1 km)', () => {
    // Distance fare = 1 * 80 = 80
    // Raw total = 150 + 80 + 30 = 260 (> 250 minimum fare)
    const result = calculateFare(1);
    expect(result.totalFare).toBe(260);
  });

  it('should enforce minimum fare floor when total is below minimum fare (0.5 km)', () => {
    // Distance fare = 0.5 * 80 = 40
    // Raw total = 150 + 40 + 30 = 220 (< 250 minimum fare)
    // Final fare should be 250
    const result = calculateFare(0.5);
    expect(result.baseFare).toBe(150);
    expect(result.distanceFare).toBe(40);
    expect(result.bookingFee).toBe(30);
    expect(result.totalFare).toBe(250); // Minimum fare enforced
  });

  it('should calculate accurate decimal distance fares (2.75 km)', () => {
    // Distance fare = 2.75 * 80 = 220
    // Total fare = 150 + 220 + 30 = 400
    const result = calculateFare(2.75);
    expect(result.distanceFare).toBe(220);
    expect(result.totalFare).toBe(400);
  });

  it('should calculate long distance rides (25 km)', () => {
    // Distance fare = 25 * 80 = 2000
    // Total fare = 150 + 2000 + 30 = 2180
    const result = calculateFare(25);
    expect(result.distanceFare).toBe(2000);
    expect(result.totalFare).toBe(2180);
  });
});
