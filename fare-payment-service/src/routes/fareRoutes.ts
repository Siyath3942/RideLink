import { Router } from 'express';
import { FareController } from '../controllers/fareController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authMiddleware';
import {
  createFareEstimateSchema,
  getFareEstimateByIdSchema,
  calculateFinalFareSchema,
} from '../validators';

const router = Router();
const controller = new FareController();

// POST /api/fares/estimate — Calculate and save a fare estimate
router.post(
  '/estimate',
  authenticate,
  validate(createFareEstimateSchema),
  controller.createEstimate
);

// GET /api/fares/estimate/:id — Retrieve a saved fare estimate
router.get(
  '/estimate/:id',
  authenticate,
  validate(getFareEstimateByIdSchema),
  controller.getEstimateById
);

// POST /api/fares/final — Calculate the final fare for a completed ride
router.post(
  '/final',
  authenticate,
  validate(calculateFinalFareSchema),
  controller.calculateFinalFare
);

export default router;
