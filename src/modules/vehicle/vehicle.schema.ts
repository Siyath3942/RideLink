import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const registerVehicleSchema = z.object({
  body: z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
    registrationNumber: z.string().min(3, 'Registration number must be at least 3 characters'),
    vehicleType: z.enum(['SEDAN', 'SUV', 'VAN', 'LUXURY', 'BIKE'], {
      errorMap: () => ({ message: 'Vehicle type must be one of: SEDAN, SUV, VAN, LUXURY, BIKE' }),
    }),
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z
      .number()
      .int('Year must be an integer')
      .min(1990, 'Vehicle year must be 1990 or newer')
      .max(currentYear + 1, `Vehicle year cannot exceed ${currentYear + 1}`),
    color: z.string().min(1, 'Color is required'),
    capacity: z.number().int('Capacity must be an integer').min(1, 'Capacity must be at least 1 seat'),
    vehicleStatus: z.enum(['APPROVED', 'PENDING', 'REJECTED']).optional().default('APPROVED'),
  }),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Vehicle ID is required'),
  }),
  body: z.object({
    registrationNumber: z.string().min(3).optional(),
    vehicleType: z.enum(['SEDAN', 'SUV', 'VAN', 'LUXURY', 'BIKE']).optional(),
    make: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    year: z
      .number()
      .int()
      .min(1990)
      .max(currentYear + 1)
      .optional(),
    color: z.string().min(1).optional(),
    capacity: z.number().int().min(1).optional(),
    vehicleStatus: z.enum(['APPROVED', 'PENDING', 'REJECTED']).optional(),
  }),
});

export const getVehicleByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Vehicle ID is required'),
  }),
});

export const getVehicleByDriverIdSchema = z.object({
  params: z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
  }),
});

export type RegisterVehicleInput = z.infer<typeof registerVehicleSchema>['body'];
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>['body'];
