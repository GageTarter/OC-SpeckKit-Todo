import { Router } from "express";
import controller from "../controllers/list.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], controller.findAll);

export default router;
