import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

try {
  console.log('Running prisma db push...');
  const output = execSync('npx prisma db push', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: 'file:./dev.db'
    }
  });
  console.log('Done!');
} catch (error) {
  console.error('Error running prisma:', error.message);
  process.exit(1);
}
