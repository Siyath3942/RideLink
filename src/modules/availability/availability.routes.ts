import { Router } from 'express';
import { AvailabilityController } from './availability.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authenticateInternalService } from '../../middleware/authMiddleware';
import { updateAvailabilitySchema, getAvailabilitySchema } from './availability.schema';

const router = Router();
const controller = new AvailabilityController();

// Update driver availability status (Driver, Admin, or Ride Management Service)
router.patch(
  '/:driverId',
  (req, res, next) => {
    // Check if request comes with internal service header first; if not, fallback to standard authenticate
    if (req.headers['x-internal-service-key']) {
      return authenticateInternalService(req, res, next);
    }
    return authenticate(req, res, next);
  },
  validate(updateAvailabilitySchema),
  controller.updateAvailability
);

// Inter-service endpoint specifically designated for Ride Management Service
router.patch(
  '/:driverId/inter-service',
  authenticateInternalService,
  validate(updateAvailabilitySchema),
  controller.updateAvailability
);

// Get driver availability status
router.get(
  '/:driverId',
  authenticate,
  validate(getAvailabilitySchema),
  controller.getAvailability
);

export default router;
