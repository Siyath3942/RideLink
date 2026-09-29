import { z } from 'zod';

export const updateAvailabilitySchema = z.object({
  params: z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
  }),
  body: z.object({
    availabilityStatus: z.enum(['AVAILABLE', 'UNAVAILABLE', 'ON_TRIP'], {
      errorMap: () => ({
        message: 'availabilityStatus must be one of: AVAILABLE, UNAVAILABLE, ON_TRIP',
      }),
    }),
  }),
});

export const getAvailabilitySchema = z.object({
  params: z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
  }),
});

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>['body'];
