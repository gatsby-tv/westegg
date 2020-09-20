import { Router } from "express";
import { SignupRequest } from "../types";
import { validateSignup } from "../middleware/auth";
import bcrypt from "bcrypt";
import User from "../entities/User";
import db from "../db";

const router = Router();

router.post("/signup", validateSignup, async (req, res, next) => {
  try {
    const signup: SignupRequest = req.body;

    // Encrypt password
    const salt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(signup.password, salt);

    // Save user and encrypted password to db
    const user = new User(signup.handle, signup.displayName, signup.email, encryptedPassword);
    await db.getConnection().manager.save(user);
    res.sendStatus(201);
  } catch (e) {
    next(e);
  }
});

// router.post("/login", async (req, res) => {

// });

export default router;