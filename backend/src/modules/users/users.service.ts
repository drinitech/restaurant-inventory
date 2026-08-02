import bcrypt from "bcryptjs";
import type { CreateUserInput, UpdateUserInput } from "@restaurant-inventory/shared";
import { prisma } from "../../prisma/client.js";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError.js";

const SELECT_PUBLIC = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  restaurantId: true,
  createdAt: true,
} as const;

export async function listUsers(restaurantId: string) {
  return prisma.user.findMany({ where: { restaurantId }, select: SELECT_PUBLIC, orderBy: { name: "asc" } });
}

export async function createUser(restaurantId: string, input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role,
      passwordHash,
      restaurantId,
    },
    select: SELECT_PUBLIC,
  });
}

export async function updateUser(restaurantId: string, targetUserId: string, input: UpdateUserInput) {
  const existing = await prisma.user.findFirst({ where: { id: targetUserId, restaurantId } });
  if (!existing) throw new NotFoundError("User");

  if (input.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: input.email } });
    if (emailTaken) throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }

  if (existing.role === "ADMIN" && input.role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { restaurantId, role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new ForbiddenError("Cannot demote the only admin — promote another user first");
    }
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { name: input.name, email: input.email, phone: input.phone ?? null, role: input.role },
    select: SELECT_PUBLIC,
  });
}

export async function deleteUser(restaurantId: string, targetUserId: string, requestingUserId: string) {
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError("You can't delete your own account here");
  }

  const existing = await prisma.user.findFirst({ where: { id: targetUserId, restaurantId } });
  if (!existing) throw new NotFoundError("User");

  if (existing.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { restaurantId, role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new ForbiddenError("Cannot delete the only admin");
    }
  }

  await prisma.user.delete({ where: { id: targetUserId } });
}
