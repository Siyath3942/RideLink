import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';

import fareRoutes from './routes/fareRoutes';
import paymentRoutes from './routes/paymentRoutes';
import receiptRoutes from './routes/receiptRoutes';
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
    service: 'Fare & Payment Service (Member 4)',
    timestamp: new Date().toISOString(),
  });
});

// Load OpenAPI / Swagger JSON Specification
const candidateSwaggerPaths = [
  path.join(__dirname, 'docs', 'swagger.json'),
  path.join(__dirname, '..', 'src', 'docs', 'swagger.json'),
  path.join(process.cwd(), 'src', 'docs', 'swagger.json'),
];
const swaggerFilePath = candidateSwaggerPaths.find((p) => fs.existsSync(p));
if (swaggerFilePath) {
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// REST API Routes
app.use('/api/fares', fareRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);

// Catch-all for undefined routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint '${req.originalUrl}' does not exist on Fare & Payment Service.`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Centralized Exception Handler
app.use(errorHandler);

export default app;
