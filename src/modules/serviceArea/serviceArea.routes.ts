import { Router } from 'express';
import { ServiceAreaController } from './serviceArea.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authMiddleware';
import { updateServiceAreaSchema, getServiceAreaSchema } from './serviceArea.schema';

const router = Router();
const controller = new ServiceAreaController();

// Update driver service area
router.put(
  '/:driverId/service-area',
  authenticate,
  validate(updateServiceAreaSchema),
  controller.updateServiceArea
);

// Get driver service area
router.get(
  '/:driverId/service-area',
  authenticate,
  validate(getServiceAreaSchema),
  controller.getServiceArea
);

export default router;
