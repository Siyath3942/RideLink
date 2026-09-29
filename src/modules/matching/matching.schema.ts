import { z } from 'zod';

export const eligibleDriversQuerySchema = z.object({
  body: z.object({
    pickupLatitude: z
      .number()
      .min(-90, 'Pickup latitude must be between -90 and 90')
      .max(90, 'Pickup latitude must be between -90 and 90'),
    pickupLongitude: z
      .number()
      .min(-180, 'Pickup longitude must be between -180 and 180')
      .max(180, 'Pickup longitude must be between -180 and 180'),
    requiredVehicleType: z.enum(['SEDAN', 'SUV', 'VAN', 'LUXURY', 'BIKE']).optional(),
    requiredCapacity: z.number().int().positive().optional().default(1),
    maxSearchRadiusKm: z.number().positive().optional().default(25.0),
  }),
});

export type EligibleDriversQueryInput = z.infer<typeof eligibleDriversQuerySchema>['body'];
