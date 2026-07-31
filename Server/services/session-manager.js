/*
==========================================================
Enterprise Performance Intelligence™
Session Manager
Version: 1.0.0

Company:
Hargun Intelligence Compass

Purpose:
Creates, validates and destroys authenticated sessions.

MVP Version:
Uses an in-memory session store.

Future:
PostgreSQL / Redis

==========================================================
*/

import crypto from "crypto";

/*
----------------------------------------------------------
In-Memory Session Store

MVP ONLY

----------------------------------------------------------
*/

const sessions = new Map();

/*
----------------------------------------------------------
Create Session
----------------------------------------------------------
*/

export function createSession(user, rememberMe = false) {

    const token = crypto.randomUUID();

    const expiresAt = new Date();

    expiresAt.setHours(

        expiresAt.getHours() +

        (rememberMe ? 168 : 8)

    );

    sessions.set(token, {

        user,

        createdAt: new Date(),

        expiresAt

    });

    return {

        token,

        expiresAt

    };

}

/*
----------------------------------------------------------
Validate Session
----------------------------------------------------------
*/

export function validateSession(token) {

    if (!sessions.has(token)) {

        return null;

    }

    const session = sessions.get(token);

    if (new Date() > session.expiresAt) {

        sessions.delete(token);

        return null;

    }

    return session;

}

/*
----------------------------------------------------------
Destroy Session
----------------------------------------------------------
*/

export function destroySession(token) {

    sessions.delete(token);

}

/*
----------------------------------------------------------
Session Count

Useful for debugging.

----------------------------------------------------------
*/

export function activeSessions() {

    return sessions.size;

}
