import express from 'express';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// No CORS middleware: the client is same-origin through the Vite proxy, and a
// permissive/allowlisted cross-origin surface only widens the attack radius.
// Host pinning is what actually enforces the localhost-only, no-auth design —
// without it, DNS rebinding lets a remote page resolve to 127.0.0.1 and read this API.
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
app.use((req, res, next) => {
  if (!LOCAL_HOST.test(req.headers.host ?? '')) {
    return res.status(403).json({ error: { message: 'Forbidden: this API only serves localhost.', code: 'forbidden' } });
  }
  next();
});

app.use(express.json({ limit: '256kb' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
