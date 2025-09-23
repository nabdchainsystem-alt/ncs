import 'dotenv/config';
import { createServer } from 'http';

import { app } from './app';
import { prisma } from './prisma';

const port = Number(process.env.PORT ?? 4000);
const server = createServer(app);

const start = async () => {
  await prisma.$connect();
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`\u2705  Server listening on http://localhost:${port}`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exitCode = 1;
});

const shutdown = async (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`\nReceived ${signal}, closing server...`);
  server.close(async (closeError) => {
    if (closeError) {
      // eslint-disable-next-line no-console
      console.error('Error while closing server', closeError);
    }
    try {
      await prisma.$disconnect();
    } catch (prismaError) {
      // eslint-disable-next-line no-console
      console.error('Error during prisma disconnect', prismaError);
    } finally {
      process.exit(0);
    }
  });
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Graceful shutdown failed', error);
      process.exit(1);
    });
  });
});
