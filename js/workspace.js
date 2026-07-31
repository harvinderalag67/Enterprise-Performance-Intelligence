/*
==========================================================
Enterprise Performance Intelligence™
Executive Workspace Controller
Version: 1.0.0

Company:
Hargun Intelligence Compass

Purpose:
Protects the Executive Workspace and manages
authenticated sessions.

==========================================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    //------------------------------------------------------
    // Session Token
    //------------------------------------------------------

    const token = sessionStorage.getItem(
        "epi_session_token"
    );

    if (!token) {

        window.location.href = "login.html";

        return;

    }

    //------------------------------------------------------
    // Validate Session
    //------------------------------------------------------

    try {

        const response = await fetch(

            "http://localhost:3000/api/auth/session",

            {

                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`

                }

            }

        );

        const result = await response.json();

        if (!response.ok) {

            sessionStorage.removeItem(
                "epi_session_token"
            );

            window.location.href =
                "login.html";

            return;

        }

        //--------------------------------------------------
        // Populate Executive Information
        //--------------------------------------------------

        if (result.data?.user) {

            setText(
                "executive-name",
                result.data.user.email
            );

            setText(
                "executive-role",
                result.data.user.role
            );

            setText(
                "session-executive",
                result.data.user.email
            );

            setText(
                "session-role",
                result.data.user.role
            );

        }

    }

    catch (error) {

        console.error(error);

        sessionStorage.removeItem(
            "epi_session_token"
        );

        window.location.href =
            "login.html";

    }

    //------------------------------------------------------
    // Logout
    //------------------------------------------------------

    const logoutButton =
        document.getElementById(
            "logout-button"
        );

    logoutButton.addEventListener(
        "click",
        logout
    );

});

/*
==========================================================
Logout
==========================================================
*/

async function logout() {

    const token =
        sessionStorage.getItem(
            "epi_session_token"
        );

    try {

        await fetch(

            "http://localhost:3000/api/auth/logout",

            {

                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${token}`

                }

            }

        );

    }

    catch {

        // Ignore network failures

    }

    sessionStorage.removeItem(
        "epi_session_token"
    );

    window.location.href = "login.html";

}

/*
==========================================================
Utility
==========================================================
*/

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}
