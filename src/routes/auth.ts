import { Router } from "express";
import { SignupRequest, LoginRequest } from "../types";
import { validateSignup } from "../middleware/auth";
import bcrypt from "bcrypt";
import User from "../entities/User";
import jwt from "jsonwebtoken";

const router = Router();
const LOGIN_EXPIRE = "2w";
const LOGIN_ERROR = new Error("Invalid credentials!");

router.post("/signup", validateSignup, async (req, res) => {
  const signup: SignupRequest = req.body;

  // Encrypt password
  const salt = await bcrypt.genSalt();
  const encryptedPassword = await bcrypt.hash(signup.password, salt);

  // Save user and encrypted password to db
  const user = new User(signup.handle, signup.displayName, signup.email, encryptedPassword);
  await user.save();

  // Sign token for created user and send to client
  const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET!, {
    expiresIn: LOGIN_EXPIRE
  });
  res.status(201).json({ token });
});

router.post("/login", async (req, res) => {
  const login: LoginRequest = req.body;
  let user: User | undefined;

  // Check if logging in with handle or email
  try {
    if (login.handle) {
      user = await User.findOne({ handle: login.handle });
    } else if (login.email) {
      user = await User.findOne({ email: login.email });
    } else {
      throw new Error("Please provide a handle or email to login!");
    }
    if (!user) throw LOGIN_ERROR;
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  // Compare passwords and send token to client
  if (await bcrypt.compare(login.password, user.password!)) {
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET!, {
      expiresIn: LOGIN_EXPIRE
    });
    res.status(200).json({ token });
  }
});

export default router;