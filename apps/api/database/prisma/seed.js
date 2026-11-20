const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const statuses = ["Open", "Closed", "Pending"];

  const tickets = Array.from({ length: 50 }, (_, index) => ({
    id: `TKT-SEED-${String(index + 1).padStart(3, "0")}`,
    name: `Customer ${index + 1}`,
    email: `customer${index + 1}@example.com`,
    status: statuses[index % statuses.length],
  }));

  for (const ticket of tickets) {
    await prisma.ticket.upsert({
      where: { id: ticket.id },
      update: ticket,
      create: ticket,
    });
  }

  const total = await prisma.ticket.count();

  console.log("50 sample tickets seeded successfully!");
  console.log(`Total tickets in database: ${total}`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });