import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initScheduledBilling } from './services/schedulerService.js';
import { initEmulator, stopEmulator } from './services/emulatorService.js';
import { seedSuperAdmin } from './utils/seedSuperAdmin.js';
import { logger } from './utils/logger.js';

const start = async () => {
  await connectDB();
  
  // Initialize background tasks
  await seedSuperAdmin();
  initScheduledBilling();
  initEmulator();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 EnergI server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal) => {
    logger.warn(`Received ${signal}. Starting graceful shutdown...`);
    
    // Stop background tasks
    stopEmulator();

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

    // Force terminate after 10 seconds
    setTimeout(() => {
      logger.error('Graceful shutdown timed out. Force exiting.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
