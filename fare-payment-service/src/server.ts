import app from './app';
import dotenv from 'dotenv';
import { prisma } from './database/prisma';

dotenv.config();

const PORT = process.env.PORT || 3004;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 RideLink Fare & Payment Microservice is Running!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
