import './config/env.js'; // fail-fast on missing env vars
import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

async function main() {
  try {
    await pool.query('SELECT 1');
    console.log(`MySQL connected: ${env.dbUser}@${env.dbHost}:${env.dbPort}/${env.dbName}`);
  } catch (err) {
    console.error('Cannot reach MySQL:', err.message);
    process.exit(1);
  }

  // localhost-only: personal single-user app, no auth
  const server = app.listen(env.port, '127.0.0.1', () => {
    console.log(`Job Tracker API listening on http://127.0.0.1:${env.port}/api`);
  });

  // Without this, a busy port surfaces as an uncaught exception stack instead of a message.
  server.on('error', (err) => {
    console.error(err.code === 'EADDRINUSE'
      ? `Port ${env.port} is already in use — stop the other API instance or set PORT in server/.env.`
      : `API failed to start: ${err.message}`);
    process.exit(1);
  });
}

main();
