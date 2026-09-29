import { Router } from 'express';
import { VehicleController } from './vehicle.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authMiddleware';
import {
  registerVehicleSchema,
  updateVehicleSchema,
  getVehicleByIdSchema,
  getVehicleByDriverIdSchema,
} from './vehicle.schema';

const router = Router();
const controller = new VehicleController();

// Register vehicle for a driver
router.post(
  '/',
  authenticate,
  validate(registerVehicleSchema),
  controller.registerVehicle
);

// Get vehicle by vehicle ID
router.get(
  '/:id',
  authenticate,
  validate(getVehicleByIdSchema),
  controller.getVehicleById
);

// Get vehicle by driver ID
router.get(
  '/driver/:driverId',
  authenticate,
  validate(getVehicleByDriverIdSchema),
  controller.getVehicleByDriverId
);

// Update vehicle details
router.put(
  '/:id',
  authenticate,
  validate(updateVehicleSchema),
  controller.updateVehicle
);

export default router;
