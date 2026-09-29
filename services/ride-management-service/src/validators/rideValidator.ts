import { z } from "zod";

export const createRideSchema = z.object({
  passengerId: z.string().min(1, "passengerId is required"),
  pickupLocation: z.string().min(1, "pickupLocation is required"),
  destination: z.string().min(1, "destination is required")
});

export const assignDriverSchema = z.object({
  driverId: z.string().min(1, "driverId is required")
});

export const updateRideStatusSchema = z.object({
  status: z.enum([
    "REQUESTED",
    "ASSIGNED",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED"
  ])
});
