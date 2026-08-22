import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";

dotenv.config();

const app = express();

/* -----------------------------------------------------
   Paths
------------------------------------------------------ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project Root
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Frontend Root
const FRONTEND_ROOT = PROJECT_ROOT;

/* -----------------------------------------------------
   Security
------------------------------------------------------ */

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(
    cors({

        origin: true,
        credentials: true
    })
);
app.use(hpp());

/* -----------------------------------------------------
   Performance
------------------------------------------------------ */

app.use(compression());

/* -----------------------------------------------------
   Logging
------------------------------------------------------ */

app.use(morgan("dev"));

/* -----------------------------------------------------
   Body Parsing
------------------------------------------------------ */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

/* -----------------------------------------------------
   Static Files
------------------------------------------------------ */

app.use(express.static(FRONTEND_ROOT));

/* -----------------------------------------------------
   Health Check
------------------------------------------------------ */

app.get("/api/health", (req, res) => {

    res.status(200).json({

        success: true,

        application: "Enterprise Performance Intelligence™",

        company: "Hargun Intelligence Compass",

        version: "1.0.0",

        environment:
            process.env.NODE_ENV || "development",

        uptime: process.uptime(),

        timestamp: new Date().toISOString()

    });

});

/* -----------------------------------------------------
   API Routes
------------------------------------------------------ */

app.use("/api/auth", authRoutes);
app.use("/api", analysisRoutes);

/* -----------------------------------------------------
   Default Route
------------------------------------------------------ */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(FRONTEND_ROOT, "index.html")
    );

});

/* -----------------------------------------------------
   404 Handler
------------------------------------------------------ */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error: "Endpoint not found."

    });

});

/* -----------------------------------------------------
   Global Error Handler
------------------------------------------------------ */

app.use((err, req, res, next) => {

    console.error(err);

    res.status(err.status || 500).json({

        success: false,

        message:
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : err.message

    });

});

export default app;
