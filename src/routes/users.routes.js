import Router from "express-promise-router";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllLogs,
  createLog
} from "../controllers/user.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { updateUserSchema } from "../schemas/user.schema.js";

const router = Router();

router.get("/users", getAllUsers);

router.get("/userslog", getAllLogs);

router.post("/userslog", createLog);

router.get("/users/:id", isAuth, getUser);

router.put("/users/:id", isAuth, validateSchema(updateUserSchema), updateUser);

router.delete("/users/:id", isAuth, deleteUser);

export default router;
