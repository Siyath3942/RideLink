import { z } from 'zod';

export const updateLocationSchema = z.object({
  params: z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
  }),
  body: z.object({
    latitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
    heading: z
      .number()
      .min(0, 'Heading must be between 0 and 360 degrees')
      .max(360, 'Heading must be between 0 and 360 degrees')
      .optional()
      .default(0.0),
  }),
});

export const getLocationSchema = z.object({
  params: z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
  }),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>['body'];
