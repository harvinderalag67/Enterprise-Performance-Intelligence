/*
==========================================================
Enterprise Performance Intelligence™
Authentication Configuration
Version: 1.0.0
==========================================================

IMPORTANT

Never store plaintext passwords in this file.

Store only password hashes.

==========================================================
*/

export const AUTH_CONFIG = Object.freeze({

    // -----------------------------------------------------
    // Administrator Account
    // -----------------------------------------------------

    ADMIN: {

        EMAIL: "admin@hargunintelligencecompass.com",

        /*
        Replace this with the bcrypt/Argon2 hash
        of your administrator password.

        Example:

        $2b$12$...................................
        */

        PASSWORD_HASH: "REPLACE_WITH_BCRYPT_HASH"

    },

    // -----------------------------------------------------
    // Session Configuration
    // -----------------------------------------------------

    SESSION: {

        TIMEOUT_MINUTES: 30,

        REMEMBER_DEVICE_DAYS: 30,

        STORAGE_KEY: "epi_session",

        REMEMBER_KEY: "epi_saved_email"

    },

    // -----------------------------------------------------
    // Security
    // -----------------------------------------------------

    SECURITY: {

        MAX_LOGIN_ATTEMPTS: 5,

        LOCKOUT_MINUTES: 15,

        PASSWORD_MIN_LENGTH: 12,

        REQUIRE_SPECIAL_CHARACTER: true,

        REQUIRE_UPPERCASE: true,

        REQUIRE_LOWERCASE: true,

        REQUIRE_NUMBER: true

    },

    // -----------------------------------------------------
    // Application
    // -----------------------------------------------------

    APP: {

        NAME: "Enterprise Performance Intelligence™",

        VERSION: "1.0.0",

        LOGIN_REDIRECT: "workspace.html",

        LOGOUT_REDIRECT: "index.html"

    }

});
