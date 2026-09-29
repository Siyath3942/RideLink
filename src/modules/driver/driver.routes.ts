import { Router } from 'express';
import { DriverController } from './driver.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';
import {
  createDriverSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
  getDriverByIdSchema,
  getDriverByAccountIdSchema,
} from './driver.schema';

const router = Router();
const controller = new DriverController();

// Create Driver operational profile
router.post(
  '/',
  authenticate,
  validate(createDriverSchema),
  controller.createDriver
);

// Get all drivers (Admin / Service)
router.get(
  '/',
  authenticate,
  controller.getAllDrivers
);

// Get driver by Account ID
router.get(
  '/account/:accountId',
  authenticate,
  validate(getDriverByAccountIdSchema),
  controller.getDriverByAccountId
);

// Get driver by Driver ID
router.get(
  '/:id',
  authenticate,
  validate(getDriverByIdSchema),
  controller.getDriverById
);

// Update driver operational profile
router.put(
  '/:id',
  authenticate,
  validate(updateDriverSchema),
  controller.updateDriver
);

// Update driver operational status (Admin or Driver)
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('ADMIN', 'DRIVER'),
  validate(updateDriverStatusSchema),
  controller.updateDriverStatus
);

export default router;
