import { Router } from 'express';
import { ReceiptController } from '../controllers/receiptController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authMiddleware';
import {
  getReceiptByIdSchema,
  getReceiptByRideIdSchema,
} from '../validators';

const router = Router();
const controller = new ReceiptController();

// GET /api/receipts/:id — Retrieve receipt by ID
router.get(
  '/:id',
  authenticate,
  validate(getReceiptByIdSchema),
  controller.getReceiptById
);

// GET /api/receipts/ride/:rideId — Retrieve receipt for a ride
router.get(
  '/ride/:rideId',
  authenticate,
  validate(getReceiptByRideIdSchema),
  controller.getReceiptByRideId
);

export default router;
