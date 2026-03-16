import { prisma } from "../src/lib/prisma";
async function main() {
  const count = await prisma.activity.count();
  console.log("Count:", count);
  // @ts-ignore
  console.log("DB URL:", process.env.DATABASE_URL);
}
main();
