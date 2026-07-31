/*
==========================================================
Enterprise Performance Intelligence™
Authentication Service
Version: 1.0.0

Company:
Hargun Intelligence Compass

Purpose:
Implements authentication business logic.

==========================================================
*/

import bcrypt from "bcrypt";

import {

    createSession

} from "./session-manager.js";

/*
----------------------------------------------------------
Temporary Administrator Configuration

NOTE

This will later be replaced by PostgreSQL.

No passwords are stored here.

----------------------------------------------------------
*/

const ADMIN = {

    email: process.env.ADMIN_EMAIL,

    role: "Administrator"

};

/*
----------------------------------------------------------
Login
----------------------------------------------------------
*/

export async function login(credentials) {

    const {

        email,
        password,
        rememberMe

    } = credentials;

    /*
    ------------------------------------------------------

    TEMPORARY LOGIN

    This will later become

    bcrypt.compare()

    against PostgreSQL.

    ------------------------------------------------------
    */

    if (

        email !== process.env.ADMIN_EMAIL

    ) {

        return {

            statusCode: 401,

            success: false,

            message: "Invalid email or password."

        };

    }

    const passwordValid = await bcrypt.compare(

        password,

        process.env.ADMIN_PASSWORD_HASH

    );

    if (!passwordValid) {

        return {

            statusCode: 401,

            success: false,

            message: "Invalid email or password."

        };

    }

    /*
------------------------------------------------------
Create Session
------------------------------------------------------
*/

    const session = createSession(

        {

            email: ADMIN.email,

            role: ADMIN.role

        },

        rememberMe

    );

    return {

        statusCode: 200,

        success: true,

        message: "Login successful.",

        data: {

            token: session.token,

            expiresAt: session.expiresAt,

            rememberMe: rememberMe || false,

            user: {

                email: ADMIN.email,

                role: ADMIN.role

            }

        },

        meta: {

            timestamp: new Date().toISOString(),

            version: "1.0.0"

        }

    };

}

/*
----------------------------------------------------------
Logout
----------------------------------------------------------
*/

export async function logout() {

    return {

        statusCode: 200,

        success: true,

        message: "Logout successful.",

        meta: {

            timestamp: new Date().toISOString(),

            version: "1.0.0"

        }

    };

}

/*
----------------------------------------------------------
Session Validation

Temporary implementation.

----------------------------------------------------------
*/

export async function session() {

    return {

        statusCode: 200,

        success: true,

        message: "Session is valid.",

        meta: {

            timestamp: new Date().toISOString(),

            version: "1.0.0"

        }

    };

}
