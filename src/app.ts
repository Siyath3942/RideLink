import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';

import driverRoutes from './modules/driver/driver.routes';
import vehicleRoutes from './modules/vehicle/vehicle.routes';
import availabilityRoutes from './modules/availability/availability.routes';
import serviceAreaRoutes from './modules/serviceArea/serviceArea.routes';
import locationRoutes from './modules/location/location.routes';
import matchingRoutes from './modules/matching/matching.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();

// Global Middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Allow Swagger UI inline scripts
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'Driver & Vehicle Service (Member 2)',
    timestamp: new Date().toISOString(),
  });
});

// Load OpenAPI / Swagger JSON Specification
const swaggerFilePath = path.join(__dirname, 'docs', 'swagger.json');
if (fs.existsSync(swaggerFilePath)) {
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// REST API Module Routes
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/drivers', availabilityRoutes);
app.use('/api/v1/drivers', serviceAreaRoutes);
app.use('/api/v1/drivers', locationRoutes);
app.use('/api/v1/drivers', matchingRoutes);

// Catch-all for undefined routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint '${req.originalUrl}' does not exist on Driver & Vehicle Service.`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Centralized Exception Handler
app.use(errorHandler);

export default app;
