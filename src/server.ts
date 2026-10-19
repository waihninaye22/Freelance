import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT ?? 4000);
if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error("JWT_ACCESS_SECRET must be set to a random value of at least 32 characters");
}

const server = app.listen(port, () => console.log(`Archer API listening on http://localhost:${port}`));

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
