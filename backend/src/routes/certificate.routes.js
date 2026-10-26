import { Router } from "express";
import {
  checkEligibility,
  downloadCertificate,
  verifyCertificate,
} from "../controllers/certificate.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Public verification
router.get("/verify/:certificateId", verifyCertificate);

// Protected routes for students
router.get("/:courseId/eligibility", requireAuth, checkEligibility);
router.get("/:courseId/download", requireAuth, downloadCertificate);

export default router;
