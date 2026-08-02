import { Router } from "express";
import { ChangePasswordSchema, LoginSchema, RegisterSchema, UpdateProfileSchema } from "@restaurant-inventory/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate(RegisterSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  "/login",
  validate(LoginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user!.sub);
    res.json(user);
  }),
);

authRouter.put(
  "/me",
  requireAuth,
  validate(UpdateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user!.sub, req.body);
    res.json(user);
  }),
);

authRouter.put(
  "/me/password",
  requireAuth,
  validate(ChangePasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.sub, req.body);
    res.status(204).send();
  }),
);
