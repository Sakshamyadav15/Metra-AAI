import { Router } from "express";
import { postTriage } from "../controllers/mailController.js";

const router = Router();

router.post("/", postTriage);

export default router;
