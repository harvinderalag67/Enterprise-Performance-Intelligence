/*
==========================================================
Enterprise Performance Intelligence™
Authentication Middleware
Version: 1.0.0

Company:
Hargun Intelligence Compass

Purpose:
Protects authenticated routes by validating the
current user session.

==========================================================
*/

import {

    validateSession

} from "../services/session-manager.js";

/*
----------------------------------------------------------
Require Authentication
----------------------------------------------------------
*/

export function requireAuthentication(req, res, next) {

    try {

        /*
        --------------------------------------------------
        Read Session Token

        Priority

        1. Authorization Header

        2. Cookie (future)

        --------------------------------------------------
        */

        const authorization = req.headers.authorization;

        if (!authorization) {

            return res.status(401).json({

                success: false,

                message: "Authentication required."

            });

        }

        /*
        --------------------------------------------------
        Expected Format

        Bearer <token>

        --------------------------------------------------
        */

        const parts = authorization.split(" ");

        if (

            parts.length !== 2 ||

            parts[0] !== "Bearer"

        ) {

            return res.status(401).json({

                success: false,

                message: "Invalid authentication token."

            });

        }

        const token = parts[1];

        const session = validateSession(token);

        if (!session) {

            return res.status(401).json({

                success: false,

                message: "Session expired or invalid."

            });

        }

        /*
        --------------------------------------------------
        Make User Available

        --------------------------------------------------
        */

        req.user = session.user;

        req.session = session;

        next();

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Authentication middleware failed."

        });

    }

}
