import { z } from 'zod';

export const updateServiceAreaSchema = z.object({
  params: z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
  }),
  body: z.object({
    city: z.string().min(1, 'City is required'),
    zoneName: z.string().min(1, 'Zone name is required'),
    centerLatitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    centerLongitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
    radiusKm: z.number().positive('Radius must be greater than 0').optional().default(15.0),
  }),
});

export const getServiceAreaSchema = z.object({
  params: z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
  }),
});

export type UpdateServiceAreaInput = z.infer<typeof updateServiceAreaSchema>['body'];
