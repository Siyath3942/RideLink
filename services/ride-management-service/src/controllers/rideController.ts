import { Request, Response } from "express";
import {
  createRide,
  assignDriver,
  getAllRides,
  updateRideStatus,
  RideStatus
} from "../services/rideService";
import {
  createRideSchema,
  assignDriverSchema,
  updateRideStatusSchema
} from "../validators/rideValidator";

export const createRideController = (req: Request, res: Response): void => {
  const result = createRideSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Invalid ride data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const { passengerId, pickupLocation, destination } = result.data;

  const ride = createRide(
    passengerId,
    pickupLocation,
    destination
  );

  res.status(201).json({
    success: true,
    message: "Ride created successfully",
    data: ride
  });
};

export const getAllRidesController = (
  _req: Request,
  res: Response
): void => {
  const rides = getAllRides();

  res.status(200).json({
    success: true,
    count: rides.length,
    data: rides
  });
};

export const updateRideStatusController = (
  req: Request,
  res: Response
): void => {
  const result = updateRideStatusSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Invalid ride status",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const rideId = req.params.rideId as string;
  const { status } = result.data;

  try {
    const ride = updateRideStatus(rideId, status);

    if (!ride) {
      res.status(404).json({
        success: false,
        message: "Ride not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Ride status updated successfully",
      data: ride
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Invalid ride status transition"
    });
  }
};

export const assignDriverController = (
  req: Request,
  res: Response
): void => {
  const result = assignDriverSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Invalid driver data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const { rideId } = req.params;
  const { driverId } = result.data;

  try {
    const ride = assignDriver(rideId as string, driverId);

    if (!ride) {
      res.status(404).json({
        success: false,
        message: "Ride not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Driver assigned successfully",
      data: ride
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Driver assignment failed"
    });
  }
};
