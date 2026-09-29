export type RideStatus =
  | "REQUESTED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  pickupLocation: string;
  destination: string;
  status: RideStatus;
  createdAt: Date;
  updatedAt: Date;
}

const rides: Ride[] = [];

const validTransitions: Record<RideStatus, RideStatus[]> = {
  REQUESTED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

export const createRide = (
  passengerId: string,
  pickupLocation: string,
  destination: string
): Ride => {
  const now = new Date();

  const ride: Ride = {
    id: `ride-${Date.now()}`,
    passengerId,
    pickupLocation,
    destination,
    status: "REQUESTED",
    createdAt: now,
    updatedAt: now
  };

  rides.push(ride);

  return ride;
};

export const getAllRides = (): Ride[] => {
  return rides;
};

export const updateRideStatus = (
  rideId: string,
  newStatus: RideStatus
): Ride | null => {
  const ride = rides.find((item) => item.id === rideId);

  if (!ride) {
    return null;
  }

  if (!validTransitions[ride.status].includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${ride.status} to ${newStatus}`
    );
  }

  ride.status = newStatus;
  ride.updatedAt = new Date();

  return ride;
};

export const assignDriver = (
  rideId: string,
  driverId: string
): Ride | null => {
  const ride = rides.find((item) => item.id === rideId);

  if (!ride) {
    return null;
  }

  if (ride.status !== "REQUESTED") {
    throw new Error(
      `Driver can only be assigned when ride status is REQUESTED`
    );
  }

  ride.driverId = driverId;
  ride.status = "ASSIGNED";
  ride.updatedAt = new Date();

  return ride;
};
