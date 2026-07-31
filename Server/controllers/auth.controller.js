/*
==========================================================
Enterprise Performance Intelligence™
Authentication Controller
Version: 1.0.0

Company:
Hargun Intelligence Compass

Purpose:
Receives authentication requests and delegates
business logic to the Authentication Service.

==========================================================
*/

import * as AuthService from "../services/auth.service.js";

/*
----------------------------------------------------------
Administrator Login
POST /api/auth/login
----------------------------------------------------------
*/

export async function login(req, res) {

    try {

        const { email, password, rememberMe } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message: "Email and password are required."

            });

        }

        const result = await AuthService.login({

            email,

            password,

            rememberMe

        });

        return res.status(result.statusCode).json(result);

    }
    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal server error."

        });

    }

}

/*
----------------------------------------------------------
Logout
POST /api/auth/logout
----------------------------------------------------------
*/

export async function logout(req, res) {

    try {

        const result = await AuthService.logout(req);

        return res.status(result.statusCode).json(result);

    }
    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal server error."

        });

    }

}

/*
----------------------------------------------------------
Validate Session
GET /api/auth/session
----------------------------------------------------------
*/

export async function session(req, res) {

    try {

        const result = await AuthService.session(req);

        return res.status(result.statusCode).json(result);

    }
    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal server error."

        });

    }

}
