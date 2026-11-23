import { PrismaClient } from "database";
import { Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function findAgentById(id: string) {
  return prisma.user.findFirst({
    where: { id, role: Role.Agent },
  });
}

export async function findAssignableAgents() {
  return prisma.user.findMany({
    where: { role: Role.Agent },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function findManagedUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function findManagedUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createManagedUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateManagedUser(
  id: string,
  data: { name?: string; email?: string; role?: Role }
) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteManagedUser(id: string) {
  return prisma.user.deleteMany({ where: { id } });
}

export async function countAdmins() {
  return prisma.user.count({ where: { role: Role.Admin } });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: Role.Customer,
    },
  });
}