import express from "express";
import {
  remove,
  logout,
  see,
  startGithublogin,
  finishGithublogin,
  getEdit,
  postEdit,
  getChangePassword,
  postChangePassword,
} from "../controllers/userController";
import {
  protectorMiddleware,
  publicOnlyMiddleware,
  avatarUpload,
} from "../middlewares";
const userRouter = express.Router();

userRouter.get("/logout", protectorMiddleware, logout);
userRouter
  .route("/edit")
  .all(protectorMiddleware)
  .get(getEdit)
  .post(avatarUpload.single("avatar"), postEdit);
userRouter
  .route("/change-password")
  .all(protectorMiddleware)
  .get(getChangePassword)
  .post(postChangePassword);

userRouter.get("/github/start", publicOnlyMiddleware, startGithublogin);
userRouter.get("/github/finish", publicOnlyMiddleware, finishGithublogin);

userRouter.get("/:id([0-9a-f]{24})", see);
export default userRouter;
