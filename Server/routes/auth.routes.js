/*
==========================================================
Enterprise Performance Intelligence™
Authentication Routes
Version: 1.0.0

Company:
Hargun Intelligence Compass

Purpose:
Defines all authentication API endpoints.

==========================================================
*/

import express from "express";

const router = express.Router();

/*
----------------------------------------------------------
Controller
----------------------------------------------------------
*/

import * as AuthController
    from "../controllers/auth.controller.js";

/*
----------------------------------------------------------
Authentication
----------------------------------------------------------
*/

/*
Administrator Login
POST /api/auth/login
*/

router.post(

    "/login",

    AuthController.login

);

/*
Logout
POST /api/auth/logout
*/

router.post(

    "/logout",

    AuthController.logout

);

/*
Validate Session
GET /api/auth/session
*/

router.get(

    "/session",

    AuthController.session

);

/*
Future Endpoints

POST /register

POST /forgot-password

POST /reset-password

POST /change-password

POST /refresh-token

GET /profile

----------------------------------------------------------
*/

export default router;
