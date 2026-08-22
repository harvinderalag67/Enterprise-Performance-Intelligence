import express from "express";
import { secureAnalyze } from "../controllers/analysis.controller.js";

const router = express.Router();

router.post("/secure-analyze", secureAnalyze);

export default router;