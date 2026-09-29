import { Router } from 'express';
import { LocationController } from './location.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authMiddleware';
import { updateLocationSchema, getLocationSchema } from './location.schema';

const router = Router();
const controller = new LocationController();

// Update driver location
router.put(
  '/:driverId/location',
  authenticate,
  validate(updateLocationSchema),
  controller.updateLocation
);

// Get driver location
router.get(
  '/:driverId/location',
  authenticate,
  validate(getLocationSchema),
  controller.getLocation
);

export default router;
