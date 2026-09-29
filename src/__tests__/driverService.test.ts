import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../database/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'ridelink_shared_secret_key_2026';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'ridelink_internal_microservice_secret_key_2026';

// Helper JWT tokens
const adminToken = jwt.sign({ userId: 'admin_1', accountId: 'acc_admin_1', role: 'ADMIN' }, JWT_SECRET);
const driverToken1 = jwt.sign({ userId: 'user_drv_100', accountId: 'acc_drv_100', role: 'DRIVER' }, JWT_SECRET);

describe('Driver & Vehicle Microservice Integration Tests', () => {
  let createdDriverId: string;
  let createdVehicleId: string;

  beforeAll(async () => {
    // Setup clean state
    await prisma.driverLocation.deleteMany();
    await prisma.serviceArea.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.driver.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Driver Management', () => {
    it('should create a driver operational profile successfully', async () => {
      const res = await request(app)
        .post('/api/v1/drivers')
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({
          accountId: 'acc_drv_100',
          licenseNumber: 'TEST-DL-100',
          licenseExpiry: '2029-12-31T00:00:00.000Z',
          driverStatus: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountId).toBe('acc_drv_100');
      expect(res.body.data.driverStatus).toBe('ACTIVE');
      expect(res.body.data.availabilityStatus).toBe('UNAVAILABLE');

      createdDriverId = res.body.data.id;
    });

    it('should reject duplicate driver creation for same accountId', async () => {
      const res = await request(app)
        .post('/api/v1/drivers')
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({
          accountId: 'acc_drv_100',
          licenseNumber: 'TEST-DL-999',
          licenseExpiry: '2029-12-31T00:00:00.000Z',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_DRIVER');
    });

    it('should retrieve driver profile by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/drivers/${createdDriverId}`)
        .set('Authorization', `Bearer ${driverToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdDriverId);
    });

    it('should return 404 for non-existent driver ID', async () => {
      const res = await request(app)
        .get('/api/v1/drivers/non_existent_driver_id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('DRIVER_NOT_FOUND');
    });
  });

  describe('2. Vehicle Management & Availability Rules', () => {
    it('should reject driver availability update if driver has no vehicle registered', async () => {
      const res = await request(app)
        .patch(`/api/v1/drivers/${createdDriverId}/availability`)
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({ availabilityStatus: 'AVAILABLE' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('NO_VEHICLE_REGISTERED');
    });

    it('should register a vehicle for the driver successfully', async () => {
      const res = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({
          driverId: createdDriverId,
          registrationNumber: 'REG-TEST-100',
          vehicleType: 'SEDAN',
          make: 'Toyota',
          model: 'Corolla',
          year: 2021,
          color: 'Blue',
          capacity: 4,
          vehicleStatus: 'APPROVED',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.registrationNumber).toBe('REG-TEST-100');
      createdVehicleId = res.body.data.id;
    });

    it('should reject duplicate vehicle registration number', async () => {
      // Create a second driver first
      const drv2Res = await request(app)
        .post('/api/v1/drivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          accountId: 'acc_drv_200',
          licenseNumber: 'TEST-DL-200',
          licenseExpiry: '2029-12-31T00:00:00.000Z',
        });

      const drv2Id = drv2Res.body.data.id;

      const res = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverId: drv2Id,
          registrationNumber: 'REG-TEST-100', // Duplicate!
          vehicleType: 'SUV',
          make: 'Nissan',
          model: 'X-Trail',
          year: 2022,
          color: 'Black',
          capacity: 5,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_REGISTRATION');
    });

    it('should now allow driver to set availability to AVAILABLE after registering vehicle', async () => {
      const res = await request(app)
        .patch(`/api/v1/drivers/${createdDriverId}/availability`)
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({ availabilityStatus: 'AVAILABLE' });

      expect(res.status).toBe(200);
      expect(res.body.data.availabilityStatus).toBe('AVAILABLE');
    });
  });

  describe('3. Service Area & Location Management', () => {
    it('should update driver service area', async () => {
      const res = await request(app)
        .put(`/api/v1/drivers/${createdDriverId}/service-area`)
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({
          city: 'Colombo',
          zoneName: 'Central Zone',
          centerLatitude: 6.9271,
          centerLongitude: 79.8612,
          radiusKm: 15.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.city).toBe('Colombo');
    });

    it('should update simulated current location', async () => {
      const res = await request(app)
        .put(`/api/v1/drivers/${createdDriverId}/location`)
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({
          latitude: 6.9271,
          longitude: 79.8612,
          heading: 90.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.latitude).toBe(6.9271);
    });

    it('should reject invalid location latitude out of range', async () => {
      const res = await request(app)
        .put(`/api/v1/drivers/${createdDriverId}/location`)
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({
          latitude: 195.0, // Invalid!
          longitude: 79.8612,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('4. Eligible Driver Retrieval & Inter-Service API', () => {
    it('should retrieve eligible driver using inter-service header key', async () => {
      const res = await request(app)
        .post('/api/v1/drivers/eligible')
        .set('X-Internal-Service-Key', INTERNAL_SERVICE_KEY)
        .send({
          pickupLatitude: 6.9280,
          pickupLongitude: 79.8620,
          requiredVehicleType: 'SEDAN',
          requiredCapacity: 2,
          maxSearchRadiusKm: 20.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].driverId).toBe(createdDriverId);
      expect(res.body.data[0].distanceKm).toBeLessThan(5.0);
    });

    it('should exclude drivers who become UNAVAILABLE', async () => {
      // Driver sets availability to UNAVAILABLE
      await request(app)
        .patch(`/api/v1/drivers/${createdDriverId}/availability`)
        .set('Authorization', `Bearer ${driverToken1}`)
        .send({ availabilityStatus: 'UNAVAILABLE' });

      const res = await request(app)
        .post('/api/v1/drivers/eligible')
        .set('X-Internal-Service-Key', INTERNAL_SERVICE_KEY)
        .send({
          pickupLatitude: 6.9280,
          pickupLongitude: 79.8620,
        });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });
  });
});
