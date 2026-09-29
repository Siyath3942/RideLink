import { Router } from 'express';
import { MatchingController } from './matching.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authenticateInternalService } from '../../middleware/authMiddleware';
import { eligibleDriversQuerySchema } from './matching.schema';

const router = Router();
const controller = new MatchingController();

// Retrieve eligible available drivers (Used by Ride Management Service or internal clients)
router.post(
  '/eligible',
  (req, res, next) => {
    if (req.headers['x-internal-service-key']) {
      return authenticateInternalService(req, res, next);
    }
    return authenticate(req, res, next);
  },
  validate(eligibleDriversQuerySchema),
  controller.getEligibleDrivers
);

export default router;
