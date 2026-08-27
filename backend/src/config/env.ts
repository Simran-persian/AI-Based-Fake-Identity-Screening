import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || '4000',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://sentry_user:sentry_password_2026@localhost:5432/sentry_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'sentry_jwt_secret_key_hackathon_2026',
  NODE_ENV: process.env.NODE_ENV || 'development',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000'
};
