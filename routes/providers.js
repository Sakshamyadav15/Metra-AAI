import { Router } from "express";
import { getProviders, postProviderTest } from "../controllers/providerController.js";

const router = Router();

router.get("/", getProviders);
router.post("/test", postProviderTest);

export default router;
