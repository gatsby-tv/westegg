import { Router } from "express";
import {
  SignupRequest,
  LoginRequest,
  isLoginEmailRequest,
  isLoginHandleRequest,
  LoginResponse,
  ErrorResponse
} from "@gatsby-tv/types";
import bcrypt from "bcrypt";
import { User } from "../entities/User";
import jwt from "jsonwebtoken";
import { validateSignup } from "../middleware/auth";
import { ErrorCode, WestEggError } from "@gatsby-tv/types";
import { SignupResponse } from "@gatsby-tv/types";
import { Password } from "../entities/Password";

const LOGIN_EXPIRE = "2w";
const LOGIN_ERROR = new WestEggError(
  ErrorCode.INVALID_CREDENTIALS,
  "Invalid credentials!"
);

const router = Router();

/**
 * POST /auth/signup
 */
router.post("/signup", validateSignup, async (req, res) => {
  try {
    const signup: SignupRequest = req.body;

    // Encrypt password
    const salt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(signup.password[0], salt);

    // Save user and encrypted password to the db
    // TODO: Is there a better way to handle this "constructor" with typing?
    // TODO: https://mongoosejs.com/docs/middleware.html mongoose validation hooks
    let user = new User({
      email: signup.email,
      handle: signup.account.handle,
      name: signup.account.name,
      creationDate: Date.now()
    });
    await user.save();

    // Save encrypted password to the db
    let password = new Password({
      user: user._id,
      password: encryptedPassword
    });
    await password.save();

    // Sign token for created user and send to client
    let json = user.toJSON();
    const token = jwt.sign(json, process.env.JWT_SECRET!, {
      expiresIn: LOGIN_EXPIRE
    });
    res.status(201).json({ token } as SignupResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

/**
 * POST /auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const login: LoginRequest = req.body;
    let user;

    // Check if logging in with handle or email
    if (isLoginHandleRequest(req.body)) {
      user = await User.findOne(User, { handle: req.body.handle });
    } else if (isLoginEmailRequest(req.body)) {
      user = await User.findOne(User, { email: req.body.email });
    } else {
      throw new WestEggError(
        ErrorCode.HANDLE_OR_EMAIL_REQUIRED,
        "Please provide a handle or email to login!"
      );
    }
    // User wasn't found
    if (!user) throw LOGIN_ERROR;

    // Get password for user
    const passwordDocument = await Password.findOne({ user: user._id });

    // Compare passwords and send token to client
    if (
      passwordDocument &&
      (await bcrypt.compare(login.password, passwordDocument.password))
    ) {
      const json = user.toJSON();
      const token = jwt.sign(json, process.env.JWT_SECRET!, {
        expiresIn: LOGIN_EXPIRE
      });
      res.status(200).json({ token } as LoginResponse);
    } else {
      // Password didn't match or wasn't found
      throw LOGIN_ERROR;
    }
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

export default router;
