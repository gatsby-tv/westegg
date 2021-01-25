import { Router } from "express";
import {
  SignupRequest,
  LoginRequest,
  isLoginEmailRequest,
  isLoginHandleRequest,
  LoginResponse,
  Unauthorized,
  ErrorMessage,
  BadRequest,
  StatusCode
} from "@gatsby-tv/types";
import bcrypt from "bcrypt";
import { User } from "../entities/User";
import jwt from "jsonwebtoken";
import { validateSignup } from "../middleware/auth";
import { SignupResponse } from "@gatsby-tv/types";
import { Password } from "../entities/Password";

const LOGIN_EXPIRE = "2w";
const LOGIN_ERROR = new Unauthorized(ErrorMessage.INVALID_CREDENTIALS);

const router = Router();

/**
 * POST /auth/signup
 */
router.post("/signup", validateSignup, async (req, res, next) => {
  try {
    const signup: SignupRequest = req.body;

    // Encrypt password
    const salt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(signup.password[0], salt);

    // Save user and encrypted password to the db
    // TODO: Is there a better way to handle this "constructor" with typing?
    // TODO: https://mongoosejs.com/docs/middleware.html mongoose validation hooks
    let user = new User({
      _id: signup.account.handle,
      email: signup.email,
      handle: signup.account.handle,
      name: signup.account.name,
      creationDate: Date.now()
    });

    // Save encrypted password to the db
    let password = new Password({
      user: user._id,
      password: encryptedPassword
    });

    // Sign token for created user and send to client
    let json = user.toJSON();
    const token = jwt.sign(json, process.env.JWT_SECRET!, {
      expiresIn: LOGIN_EXPIRE
    });

    await user.save();
    await password.save();

    res.status(StatusCode.CREATED).json({ token } as SignupResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 */
router.post("/login", async (req, res, next) => {
  try {
    const login: LoginRequest = req.body;
    let user;

    // Check if logging in with handle or email
    if (isLoginHandleRequest(req.body)) {
      user = await User.findById(req.body.handle);
    } else if (isLoginEmailRequest(req.body)) {
      user = await User.findById(req.body.email);
    } else {
      throw new BadRequest(ErrorMessage.HANDLE_OR_EMAIL_REQUIRED);
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
      res.status(StatusCode.OK).json({ token } as LoginResponse);
    } else {
      // Password didn't match or wasn't found
      throw LOGIN_ERROR;
    }
  } catch (error) {
    next(error);
  }
});

export default router;
