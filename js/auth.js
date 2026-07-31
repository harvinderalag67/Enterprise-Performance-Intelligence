/*
==========================================================
Enterprise Performance Intelligence™
Authentication Service
Version: 1.0.0
==========================================================
*/

import { AUTH_CONFIG } from "../config/auth-config.js";

export class AuthService {

    // -----------------------------------------------------
    // Login
    // -----------------------------------------------------

    static async login(email, password) {

        const normalizedEmail = email.trim().toLowerCase();

        // Check account lock

        if (this.isLocked()) {

            throw new Error(
                "Too many failed login attempts. Please try again later."
            );

        }

        // Verify administrator email

        if (normalizedEmail !== AUTH_CONFIG.ADMIN.EMAIL.toLowerCase()) {

            this.recordFailedAttempt();

            throw new Error(
                "Invalid email or password."
            );

        }

        /*
        ======================================================
        TEMPORARY PASSWORD CHECK

        Replace this entire block with bcrypt/Argon2
        verification once backend authentication
        is connected.

        Example:

        const valid =
            await bcrypt.compare(
                password,
                AUTH_CONFIG.ADMIN.PASSWORD_HASH
            );

        ======================================================
        */

        if (password !== "Harvinder@67$$") {

            this.recordFailedAttempt();

            throw new Error(
                "Invalid email or password."
            );

        }

        // Successful login

        this.clearFailedAttempts();

        return {

            authenticated: true,

            email: AUTH_CONFIG.ADMIN.EMAIL,

            role: "Administrator",

            loginTime: new Date().toISOString()

        };

    }

    // -----------------------------------------------------
    // Failed Attempts
    // -----------------------------------------------------

    static recordFailedAttempt() {

        let attempts = Number(

            localStorage.getItem(
                "epi_login_attempts"
            )

        ) || 0;

        attempts++;

        localStorage.setItem(

            "epi_login_attempts",

            attempts

        );

        if (

            attempts >=
            AUTH_CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS

        ) {

            localStorage.setItem(

                "epi_lock_time",

                Date.now()

            );

        }

    }

    // -----------------------------------------------------
    // Clear Failed Attempts
    // -----------------------------------------------------

    static clearFailedAttempts() {

        localStorage.removeItem(

            "epi_login_attempts"

        );

        localStorage.removeItem(

            "epi_lock_time"

        );

    }

    // -----------------------------------------------------
    // Lock Check
    // -----------------------------------------------------

    static isLocked() {

        const lockTime = Number(

            localStorage.getItem(
                "epi_lock_time"
            )

        );

        if (!lockTime) {

            return false;

        }

        const elapsedMinutes =

            (Date.now() - lockTime) / 60000;

        if (

            elapsedMinutes >=
            AUTH_CONFIG.SECURITY.LOCKOUT_MINUTES

        ) {

            this.clearFailedAttempts();

            return false;

        }

        return true;

    }

    // -----------------------------------------------------
    // Logout
    // -----------------------------------------------------

    static logout() {

        localStorage.removeItem(

            AUTH_CONFIG.SESSION.STORAGE_KEY

        );

        sessionStorage.removeItem(

            AUTH_CONFIG.SESSION.STORAGE_KEY

        );

        window.location.href =

            AUTH_CONFIG.APP.LOGOUT_REDIRECT;

    }

}
