import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginInput, RegisterInput } from "@restaurant-inventory/shared";
import { prisma } from "../../prisma/client.js";
import { env } from "../../config/env.js";
import { AppError, UnauthorizedError } from "../../utils/AppError.js";

function signToken(user: { id: string; role: string; restaurantId: string }) {
  const options: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ sub: user.id, role: user.role, restaurantId: user.restaurantId }, env.JWT_SECRET, options);
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }
  const restaurant = await prisma.restaurant.findUnique({ where: { id: input.restaurantId } });
  if (!restaurant) {
    throw new AppError(400, "INVALID_RESTAURANT", "restaurantId does not exist");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      restaurantId: input.restaurantId,
    },
  });
  const token = signToken(user);
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new UnauthorizedError("Invalid email or password");
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");
  const token = signToken(user);
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } };
}
