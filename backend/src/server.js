import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initScheduledBilling } from './services/schedulerService.js';

const start = async () => {
  await connectDB();
  
  // Initialize background tasks
  initScheduledBilling();

  app.listen(env.PORT, () => {
    console.log(`🚀 EnergI server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start();
