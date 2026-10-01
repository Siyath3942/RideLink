import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authMiddleware';
import {
  createPaymentSchema,
  getPaymentByIdSchema,
  getPaymentsByRideIdSchema,
  getPaymentsByPassengerIdSchema,
} from '../validators';

const router = Router();
const controller = new PaymentController();

// POST /api/payments — Create a simulated payment
router.post(
  '/',
  authenticate,
  validate(createPaymentSchema),
  controller.createPayment
);

// GET /api/payments/:id — Retrieve payment by ID
router.get(
  '/:id',
  authenticate,
  validate(getPaymentByIdSchema),
  controller.getPaymentById
);

// GET /api/payments/ride/:rideId — Retrieve payments for a ride
router.get(
  '/ride/:rideId',
  authenticate,
  validate(getPaymentsByRideIdSchema),
  controller.getPaymentsByRideId
);

// GET /api/payments/passenger/:passengerId — Retrieve payment history for a passenger
router.get(
  '/passenger/:passengerId',
  authenticate,
  validate(getPaymentsByPassengerIdSchema),
  controller.getPaymentsByPassengerId
);

export default router;
