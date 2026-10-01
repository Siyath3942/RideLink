import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { prisma } from '../src/database/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'ridelink_shared_secret_key_2026';

const passengerToken = `Bearer ${jwt.sign(
  { userId: 'test-passenger-101', accountId: 'acc-passenger-101', role: 'PASSENGER' },
  JWT_SECRET,
  { expiresIn: '1h' }
)}`;

const driverToken = `Bearer ${jwt.sign(
  { userId: 'test-driver-202', accountId: 'acc-driver-202', role: 'DRIVER' },
  JWT_SECRET,
  { expiresIn: '1h' }
)}`;

describe('Fare & Payment Service API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure clean state
    await prisma.receipt.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.fareEstimate.deleteMany();
  });

  afterAll(async () => {
    await prisma.receipt.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.fareEstimate.deleteMany();
    await prisma.$disconnect();
  });

  // ─── Health Check ────────────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200 UP status without authentication', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toContain('Fare & Payment Service');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ─── Authentication & Security ───────────────────────────────────────────────

  describe('Security & Authentication Middleware', () => {
    it('should reject requests without authorization token with 401', async () => {
      const res = await request(app).post('/api/fares/estimate').send({
        rideId: 'ride-unauth',
        passengerId: 'p-unauth',
        distanceKm: 5,
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid token with 401', async () => {
      const res = await request(app)
        .post('/api/fares/estimate')
        .set('Authorization', 'Bearer invalid.token.value')
        .send({
          rideId: 'ride-unauth',
          passengerId: 'p-unauth',
          distanceKm: 5,
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  // ─── Fare Estimation API ─────────────────────────────────────────────────────

  describe('POST /api/fares/estimate', () => {
    it('should calculate and persist fare estimate for positive distance', async () => {
      const res = await request(app)
        .post('/api/fares/estimate')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-test-001',
          passengerId: 'passenger-test-001',
          distanceKm: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.rideId).toBe('ride-test-001');
      expect(res.body.data.distanceKm).toBe(10);
      expect(res.body.data.baseFare).toBe(150);
      expect(res.body.data.distanceFare).toBe(800); // 10 * 80
      expect(res.body.data.bookingFee).toBe(30);
      expect(res.body.data.totalFare).toBe(980); // 150 + 800 + 30
      expect(res.body.data.currency).toBe('LKR');
    });

    it('should reject non-positive / zero distance with 400 validation error', async () => {
      const resZero = await request(app)
        .post('/api/fares/estimate')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-zero',
          passengerId: 'passenger-zero',
          distanceKm: 0,
        });

      expect(resZero.status).toBe(400);
      expect(resZero.body.success).toBe(false);
      expect(resZero.body.error.code).toBe('VALIDATION_ERROR');

      const resNegative = await request(app)
        .post('/api/fares/estimate')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-neg',
          passengerId: 'passenger-neg',
          distanceKm: -5,
        });

      expect(resNegative.status).toBe(400);
      expect(resNegative.body.success).toBe(false);
    });

    it('should reject invalid distance type (string) with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/fares/estimate')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-bad',
          passengerId: 'passenger-bad',
          distanceKm: 'ten-km',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/fares/estimate')
        .set('Authorization', passengerToken)
        .send({
          distanceKm: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/fares/estimate/:id', () => {
    it('should retrieve a previously saved fare estimate', async () => {
      // Create one first
      const createRes = await request(app)
        .post('/api/fares/estimate')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-get-est-001',
          passengerId: 'passenger-001',
          distanceKm: 4.5,
        });
      const estimateId = createRes.body.data.id;

      const getRes = await request(app)
        .get(`/api/fares/estimate/${estimateId}`)
        .set('Authorization', passengerToken);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.id).toBe(estimateId);
      expect(getRes.body.data.distanceKm).toBe(4.5);
    });

    it('should return 404 for non-existent estimate ID', async () => {
      const res = await request(app)
        .get('/api/fares/estimate/non-existent-uuid-999')
        .set('Authorization', passengerToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FARE_ESTIMATE_NOT_FOUND');
    });
  });

  // ─── Final Fare API ──────────────────────────────────────────────────────────

  describe('POST /api/fares/final', () => {
    it('should calculate final fare breakdown without persisting', async () => {
      const res = await request(app)
        .post('/api/fares/final')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-final-001',
          passengerId: 'passenger-final-001',
          distanceKm: 6.2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rideId).toBe('ride-final-001');
      expect(res.body.data.distanceKm).toBe(6.2);
      expect(res.body.data.baseFare).toBe(150);
      expect(res.body.data.distanceFare).toBe(496); // 6.2 * 80
      expect(res.body.data.bookingFee).toBe(30);
      expect(res.body.data.totalFare).toBe(676);
      expect(res.body.data.currency).toBe('LKR');
    });

    it('should apply minimum fare for final fare when distance is tiny', async () => {
      const res = await request(app)
        .post('/api/fares/final')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-final-min',
          passengerId: 'passenger-final-min',
          distanceKm: 0.2, // 0.2 * 80 = 16. Total = 150 + 16 + 30 = 196 < 250
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalFare).toBe(250); // Minimum fare enforced
    });

    it('should reject invalid distance in final fare calculation', async () => {
      const res = await request(app)
        .post('/api/fares/final')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-final-invalid',
          passengerId: 'passenger-final-invalid',
          distanceKm: -2,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Payments API ────────────────────────────────────────────────────────────

  describe('POST /api/payments', () => {
    it('should process a successful CASH payment and generate a receipt', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-pay-cash-01',
          passengerId: 'passenger-101',
          amount: 580,
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment).toBeDefined();
      expect(res.body.data.payment.status).toBe('SUCCESS');
      expect(res.body.data.payment.paymentMethod).toBe('CASH');
      expect(res.body.data.payment.transactionReference).toMatch(/^TXN-/);
      expect(res.body.data.receipt).toBeDefined();
      expect(res.body.data.receipt.paymentId).toBe(res.body.data.payment.id);
      expect(res.body.data.receipt.amount).toBe(580);
      expect(res.body.data.receipt.currency).toBe('LKR');
    });

    it('should process a successful CARD payment and generate a receipt', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-pay-card-01',
          passengerId: 'passenger-101',
          amount: 1200,
          paymentMethod: 'CARD',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.payment.status).toBe('SUCCESS');
      expect(res.body.data.payment.paymentMethod).toBe('CARD');
      expect(res.body.data.receipt).not.toBeNull();
    });

    it('should process a successful WALLET payment and generate a receipt', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-pay-wallet-01',
          passengerId: 'passenger-101',
          amount: 450,
          paymentMethod: 'WALLET',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.payment.status).toBe('SUCCESS');
      expect(res.body.data.payment.paymentMethod).toBe('WALLET');
      expect(res.body.data.receipt).not.toBeNull();
    });

    it('should handle simulated payment failure and NOT generate a receipt', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-fail-001',
          passengerId: 'passenger-101',
          amount: 350,
          paymentMethod: 'CARD',
          simulateFailure: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.status).toBe('FAILED');
      expect(res.body.data.receipt).toBeNull();

      // Ensure no receipt exists in database for this payment
      const dbReceipt = await prisma.receipt.findFirst({
        where: { paymentId: res.body.data.payment.id },
      });
      expect(dbReceipt).toBeNull();
    });

    it('should reject invalid payment method with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-invalid-pm',
          passengerId: 'passenger-101',
          amount: 500,
          paymentMethod: 'BITCOIN', // Invalid method
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject negative or zero payment amount with 400', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-bad-amt',
          passengerId: 'passenger-101',
          amount: -50,
          paymentMethod: 'CARD',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/:id', () => {
    it('should retrieve payment details by ID', async () => {
      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-get-pay-01',
          passengerId: 'passenger-101',
          amount: 750,
          paymentMethod: 'CARD',
        });
      const paymentId = payRes.body.data.payment.id;

      const res = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', passengerToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(paymentId);
      expect(res.body.data.amount).toBe(750);
      expect(res.body.data.receipt).toBeDefined();
    });

    it('should return 404 for non-existent payment ID', async () => {
      const res = await request(app)
        .get('/api/payments/non-existent-pay-999')
        .set('Authorization', passengerToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });
  });

  describe('GET /api/payments/ride/:rideId', () => {
    it('should retrieve all payments for a specific ride', async () => {
      const targetRideId = 'ride-multi-pay-01';

      // Create two payments for this ride (e.g. failed first, retry successful)
      await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: targetRideId,
          passengerId: 'passenger-101',
          amount: 600,
          paymentMethod: 'CARD',
          simulateFailure: true,
        });

      await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: targetRideId,
          passengerId: 'passenger-101',
          amount: 600,
          paymentMethod: 'CASH',
        });

      const res = await request(app)
        .get(`/api/payments/ride/${targetRideId}`)
        .set('Authorization', passengerToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/payments/passenger/:passengerId', () => {
    it('should retrieve payment history for a passenger', async () => {
      const targetPassengerId = 'passenger-hist-007';

      await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-hist-1',
          passengerId: targetPassengerId,
          amount: 400,
          paymentMethod: 'CASH',
        });

      await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-hist-2',
          passengerId: targetPassengerId,
          amount: 850,
          paymentMethod: 'CARD',
        });

      const res = await request(app)
        .get(`/api/payments/passenger/${targetPassengerId}`)
        .set('Authorization', passengerToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(2);
      expect(res.body.data.every((p: any) => p.passengerId === targetPassengerId)).toBe(true);
    });
  });

  // ─── Receipts API ────────────────────────────────────────────────────────────

  describe('Receipts API', () => {
    it('should retrieve receipt by receipt ID', async () => {
      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId: 'ride-rec-test-01',
          passengerId: 'passenger-rec-01',
          amount: 920,
          paymentMethod: 'CARD',
        });

      const receiptId = payRes.body.data.receipt.id;

      const res = await request(app)
        .get(`/api/receipts/${receiptId}`)
        .set('Authorization', passengerToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(receiptId);
      expect(res.body.data.amount).toBe(920);
      expect(res.body.data.currency).toBe('LKR');
    });

    it('should retrieve receipt by ride ID', async () => {
      const rideId = 'ride-rec-by-ride-01';

      await request(app)
        .post('/api/payments')
        .set('Authorization', passengerToken)
        .send({
          rideId,
          passengerId: 'passenger-rec-02',
          amount: 320,
          paymentMethod: 'CASH',
        });

      const res = await request(app)
        .get(`/api/receipts/ride/${rideId}`)
        .set('Authorization', passengerToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rideId).toBe(rideId);
      expect(res.body.data.amount).toBe(320);
    });

    it('should return 404 for non-existent receipt ID', async () => {
      const res = await request(app)
        .get('/api/receipts/non-existent-rec-999')
        .set('Authorization', passengerToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RECEIPT_NOT_FOUND');
    });

    it('should return 404 when querying receipt for a ride with no successful payment', async () => {
      const res = await request(app)
        .get('/api/receipts/ride/ride-without-any-receipt')
        .set('Authorization', passengerToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RECEIPT_NOT_FOUND');
    });
  });

  // ─── Undefined Routes ────────────────────────────────────────────────────────

  describe('Undefined Route Handling', () => {
    it('should return 404 ROUTE_NOT_FOUND for unknown endpoints', async () => {
      const res = await request(app).get('/api/fares/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });
});
