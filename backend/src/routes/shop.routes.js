import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getShopCatalog,
  purchaseItem,
  equipItem,
} from "../controllers/shop.controller.js";

const router = Router();

router.get("/items", requireAuth, getShopCatalog);
router.post("/buy", requireAuth, purchaseItem);
router.post("/equip", requireAuth, equipItem);

export default router;
