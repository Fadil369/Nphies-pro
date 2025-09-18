import { createServer } from 'http';

import { createApp } from './app';

const app = createApp();
const server = createServer(app);

const PORT = Number(process.env.PORT ?? 3001);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Platform Gateway listening on port ${PORT}`);
});
