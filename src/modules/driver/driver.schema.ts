import { z } from 'zod';

export const createDriverSchema = z.object({
  body: z.object({
    accountId: z.string().min(1, 'Account ID is required'),
    licenseNumber: z.string().min(3, 'License number must be at least 3 characters'),
    licenseExpiry: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid license expiry date string (ISO format expected)',
    }),
    driverStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional().default('ACTIVE'),
  }),
});

export const updateDriverSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Driver ID is required'),
  }),
  body: z.object({
    licenseNumber: z.string().min(3).optional(),
    licenseExpiry: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid license expiry date string',
    }).optional(),
    driverStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
});

export const updateDriverStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Driver ID is required'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  }),
});

export const getDriverByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Driver ID is required'),
  }),
});

export const getDriverByAccountIdSchema = z.object({
  params: z.object({
    accountId: z.string().min(1, 'Account ID is required'),
  }),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>['body'];
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>['body'];
export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>['body'];
