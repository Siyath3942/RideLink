import dotenv from 'dotenv';
dotenv.config();

/**
 * Fare configuration values loaded from environment variables.
 * Centralised so they are never hardcoded throughout the codebase.
 */
export const fareConfig = {
  /** Base fare in LKR */
  baseFare: Number(process.env.BASE_FARE) || 150,

  /** Rate per kilometer in LKR */
  ratePerKm: Number(process.env.RATE_PER_KM) || 80,

  /** Fixed booking fee in LKR */
  bookingFee: Number(process.env.BOOKING_FEE) || 30,

  /** Minimum fare floor in LKR */
  minimumFare: Number(process.env.MINIMUM_FARE) || 250,

  /** Currency code */
  currency: process.env.CURRENCY || 'LKR',
};

/**
 * Inter-service URLs.
 */
export const serviceUrls = {
  rideService: process.env.RIDE_SERVICE_URL || 'http://localhost:3003',
  driverService: process.env.DRIVER_SERVICE_URL || 'http://localhost:3002',
  accountService: process.env.ACCOUNT_SERVICE_URL || 'http://localhost:3001',
};

/**
 * Authentication & security configuration.
 */
export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'ridelink_shared_secret_key_2026',
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || 'ridelink_internal_microservice_secret_key_2026',
};

/**
 * Server configuration.
 */
export const serverConfig = {
  port: Number(process.env.PORT) || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',
};
