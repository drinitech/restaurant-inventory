import { Router } from "express";
import { CreateUserSchema, UpdateUserSchema } from "@restaurant-inventory/shared";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as usersService from "./users.service.js";

export const usersRouter = Router();
usersRouter.use(requireAuth, requireRole("ADMIN"));

usersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await usersService.listUsers(req.user!.restaurantId);
    res.json(users);
  }),
);

usersRouter.post(
  "/",
  validate(CreateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await usersService.createUser(req.user!.restaurantId, req.body);
    res.status(201).json(user);
  }),
);

usersRouter.put(
  "/:id",
  validate(UpdateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await usersService.updateUser(req.user!.restaurantId, req.params.id, req.body);
    res.json(user);
  }),
);

usersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await usersService.deleteUser(req.user!.restaurantId, req.params.id, req.user!.sub);
    res.status(204).send();
  }),
);
