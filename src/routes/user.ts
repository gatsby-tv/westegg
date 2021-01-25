import {
  ErrorMessage,
  GetUserAccountRequest,
  NotFound,
  StatusCode
} from "@gatsby-tv/types";
import { Router, Request } from "express";
import * as ExpressCore from "express-serve-static-core";
import { User } from "../entities/User";

const router = Router();

/**
 * GET /user/:handle
 */
interface GetUserAccountRequestParams
  extends ExpressCore.ParamsDictionary,
    GetUserAccountRequest {}
router.get(
  "/:handle",
  async (req: Request<GetUserAccountRequestParams, {}, {}, {}>, res, next) => {
    try {
      // TODO: as GetUserAccountRequest
      const request = req.params;

      const user = await User.findById(request.handle);

      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      // TODO: as GetUserAccountResponse
      res.status(StatusCode.OK).json(user.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

export default router;
