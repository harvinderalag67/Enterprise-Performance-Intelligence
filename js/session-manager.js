/*
==========================================================
Enterprise Performance Intelligence™
Session Manager
Version: 1.0.0
==========================================================
*/

import { AUTH_CONFIG } from "../config/auth-config.js";

export class SessionManager {

    // -----------------------------------------------------
    // Create Session
    // -----------------------------------------------------

    static create(user, rememberDevice = false) {

        const now = Date.now();

        const expiresAt =
            now +
            AUTH_CONFIG.SESSION.TIMEOUT_MINUTES *
            60 *
            1000;

        const session = {

            sessionId: crypto.randomUUID(),

            authenticated: true,

            email: user.email,

            role: user.role,

            loginTime: new Date(now).toISOString(),

            expiresAt,

            rememberDevice,

            appVersion: AUTH_CONFIG.APP.VERSION

        };

        if (rememberDevice) {

            localStorage.setItem(

                AUTH_CONFIG.SESSION.STORAGE_KEY,

                JSON.stringify(session)

            );

        }
        else {

            sessionStorage.setItem(

                AUTH_CONFIG.SESSION.STORAGE_KEY,

                JSON.stringify(session)

            );

        }

        return session;

    }

    // -----------------------------------------------------
    // Current Session
    // -----------------------------------------------------

    static getCurrent() {

        let session =

            sessionStorage.getItem(

                AUTH_CONFIG.SESSION.STORAGE_KEY

            );

        if (!session) {

            session =

                localStorage.getItem(

                    AUTH_CONFIG.SESSION.STORAGE_KEY

                );

        }

        if (!session) {

            return null;

        }

        return JSON.parse(session);

    }

    // -----------------------------------------------------
    // Session Validity
    // -----------------------------------------------------

    static isAuthenticated() {

        const session = this.getCurrent();

        if (!session) {

            return false;

        }

        if (Date.now() > session.expiresAt) {

            this.destroy();

            return false;

        }

        return session.authenticated === true;

    }

    // -----------------------------------------------------
    // Extend Session
    // -----------------------------------------------------

    static refresh() {

        const session = this.getCurrent();

        if (!session) {

            return;
        }

        session.expiresAt =

            Date.now() +

            AUTH_CONFIG.SESSION.TIMEOUT_MINUTES *

            60 *

            1000;

        if (session.rememberDevice) {

            localStorage.setItem(

                AUTH_CONFIG.SESSION.STORAGE_KEY,

                JSON.stringify(session)

            );

        }
        else {

            sessionStorage.setItem(

                AUTH_CONFIG.SESSION.STORAGE_KEY,

                JSON.stringify(session)

            );

        }

    }

    // -----------------------------------------------------
    // Destroy Session
    // -----------------------------------------------------

    static destroy() {

        localStorage.removeItem(

            AUTH_CONFIG.SESSION.STORAGE_KEY

        );

        sessionStorage.removeItem(

            AUTH_CONFIG.SESSION.STORAGE_KEY

        );

    }

    // -----------------------------------------------------
    // Route Protection
    // -----------------------------------------------------

    static protect() {

        if (!this.isAuthenticated()) {

            window.location.href =

                AUTH_CONFIG.APP.LOGOUT_REDIRECT;

        }

    }

}
