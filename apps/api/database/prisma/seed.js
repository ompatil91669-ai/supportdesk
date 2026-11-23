require("dotenv").config({
  path: require("path").resolve(__dirname, "..", ".env"),
  quiet: true,
});

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function createSeedTickets(customers) {
  const statuses = ["Open", "Closed", "Pending"];
  const customersByEmail = new Map(
    customers.map((customer) => [customer.email, customer.id])
  );

  return Array.from({ length: 50 }, (_, index) => {
    const email = `customer${index + 1}@example.com`;

    return {
      id: `TKT-SEED-${String(index + 1).padStart(3, "0")}`,
      name: `Customer ${index + 1}`,
      email,
      status: statuses[index % statuses.length],
      userId: customersByEmail.get(email) ?? null,
    };
  });
}

async function main() {
  const customerEmails = Array.from(
    { length: 50 },
    (_, index) => `customer${index + 1}@example.com`
  );
  const customers = await prisma.user.findMany({
    where: {
      role: "Customer",
      email: { in: customerEmails },
    },
    select: { id: true, email: true },
  });
  const tickets = createSeedTickets(customers);

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

if (require.main === module) {
  main()
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { createSeedTickets };