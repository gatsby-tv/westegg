import { Router } from "express";
import { SignupRequest, LoginRequest } from "../requestTypes";
import bcrypt from "bcrypt";
import { User } from "../entities/User";
import jwt from "jsonwebtoken";
import { validateSignup } from "../middleware/auth";

const router = Router();
const LOGIN_EXPIRE = "2w";
const LOGIN_ERROR = new Error("Invalid credentials!");

router.post("/signup", validateSignup, async (req, res) => {
  const signup: SignupRequest = req.body;

  // Encrypt password
  const salt = await bcrypt.genSalt();
  const encryptedPassword = await bcrypt.hash(signup.password, salt);

  // Save user and encrypted password to db
  let user = await User.create({
    handle: signup.handle,
    displayName: signup.displayName,
    email: signup.email,
    password: encryptedPassword,
    channels: []
  });
  await user.save();

  // Remove password before sending back to client
  let json = user.toJSON();
  delete json.password;

  // Sign token for created user and send to client
  const token = jwt.sign(json, process.env.JWT_SECRET!, {
    expiresIn: LOGIN_EXPIRE
  });
  res.status(201).json({ token });
});

router.post("/login", async (req, res) => {
  const login: LoginRequest = req.body;
  let user;

  try {
    // Check if logging in with handle or email
    if (login.handle) {
      user = await User.findOne({ handle: login.handle });
    } else if (login.email) {
      user = await User.findOne(User, { email: login.email });
    } else {
      throw new Error("Please provide a handle or email to login!");
    }
    // User wasn't found
    if (!user) throw LOGIN_ERROR;

    // Compare passwords and send token to client
    if (
      user.password &&
      (await bcrypt.compare(login.password, user.password))
    ) {
      // Remove password before sending back to client
      let json = user.toJSON();
      delete json.password;

      const token = jwt.sign(json, process.env.JWT_SECRET!, {
        expiresIn: LOGIN_EXPIRE
      });
      res.status(200).json({ token });
    } else {
      // Password didn't match or wasn't found
      throw LOGIN_ERROR;
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
