import 'dotenv/config';

import { createServer } from 'node:http';

import { createApp } from './app.js';
import { initRealtime } from './socket.js';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const app = createApp();
const server = createServer(app);

initRealtime(server);

server.listen(port, host, () => {
  console.log(`BlindTinder backend running on http://${host}:${port}`);
});