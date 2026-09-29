import { Router } from "express";
import {
  createRideController,
  assignDriverController,
  getAllRidesController,
  updateRideStatusController
} from "../controllers/rideController";

const router = Router();

router.post("/", createRideController);
router.patch("/:rideId/assign-driver", assignDriverController);
router.get("/", getAllRidesController);
router.patch("/:rideId/status", updateRideStatusController);

export default router;
