import { z } from 'zod';

// ─── Fare Estimation ───────────────────────────────────────────────────────────

export const createFareEstimateSchema = z.object({
  body: z.object({
    rideId: z.string().min(1, 'rideId is required'),
    passengerId: z.string().min(1, 'passengerId is required'),
    distanceKm: z
      .number({ required_error: 'distanceKm is required', invalid_type_error: 'distanceKm must be a number' })
      .positive('distanceKm must be a positive number'),
  }),
});

export const getFareEstimateByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Fare estimate ID is required'),
  }),
});

// ─── Final Fare ────────────────────────────────────────────────────────────────

export const calculateFinalFareSchema = z.object({
  body: z.object({
    rideId: z.string().min(1, 'rideId is required'),
    passengerId: z.string().min(1, 'passengerId is required'),
    distanceKm: z
      .number({ required_error: 'distanceKm is required', invalid_type_error: 'distanceKm must be a number' })
      .positive('distanceKm must be a positive number'),
  }),
});

// ─── Payments ──────────────────────────────────────────────────────────────────

export const PAYMENT_METHODS = ['CASH', 'CARD', 'WALLET'] as const;

export const createPaymentSchema = z.object({
  body: z.object({
    rideId: z.string().min(1, 'rideId is required'),
    passengerId: z.string().min(1, 'passengerId is required'),
    amount: z
      .number({ required_error: 'amount is required', invalid_type_error: 'amount must be a number' })
      .positive('amount must be a positive number'),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      errorMap: () => ({ message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}` }),
    }),
    simulateFailure: z.boolean().optional().default(false),
  }),
});

export const getPaymentByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment ID is required'),
  }),
});

export const getPaymentsByRideIdSchema = z.object({
  params: z.object({
    rideId: z.string().min(1, 'Ride ID is required'),
  }),
});

export const getPaymentsByPassengerIdSchema = z.object({
  params: z.object({
    passengerId: z.string().min(1, 'Passenger ID is required'),
  }),
});

// ─── Receipts ──────────────────────────────────────────────────────────────────

export const getReceiptByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Receipt ID is required'),
  }),
});

export const getReceiptByRideIdSchema = z.object({
  params: z.object({
    rideId: z.string().min(1, 'Ride ID is required'),
  }),
});
