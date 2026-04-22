import { Router } from "express";
import { postDiscard, postSend } from "../controllers/sendController.js";

const router = Router();

router.post("/send", postSend);
router.post("/discard", postDiscard);

export default router;
