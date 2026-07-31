/*
==========================================================
Enterprise Performance Intelligence™
Executive Login Controller
Version: 1.0
==========================================================
*/
import { AuthService }
    from "./auth.js";
document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------
    // Elements
    // -----------------------------------------------------

    const loginForm = document.getElementById("loginForm");

    const email = document.getElementById("email");

    const password = document.getElementById("password");

    const remember = document.getElementById("remember");

    const loginButton = document.getElementById("loginButton");

    const loading = document.getElementById("loading");

    const statusMessage = document.getElementById("statusMessage");

    const togglePassword = document.getElementById("togglePassword");

    const emailError = document.getElementById("emailError");

    const passwordError = document.getElementById("passwordError");


    // -----------------------------------------------------
    // Initialisation
    // -----------------------------------------------------

    loadRememberedEmail();


    // -----------------------------------------------------
    // Password Toggle
    // -----------------------------------------------------

    togglePassword.addEventListener("click", () => {

        if (password.type === "password") {

            password.type = "text";

            togglePassword.textContent = "🙈";

            togglePassword.setAttribute("aria-label", "Hide Password");

        }
        else {

            password.type = "password";

            togglePassword.textContent = "👁";

            togglePassword.setAttribute("aria-label", "Show Password");

        }

    });


    // -----------------------------------------------------
    // Login Submit
    // -----------------------------------------------------

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearErrors();

        if (!validateForm()) {

            return;

        }

        setLoading(true);

        try {

            /*
            ==================================================
            Temporary Development Authentication

            This will be replaced by auth.js

            await AuthService.login(email,password)

            ==================================================
            */

            const result = await AuthService.login(

                email.value,

                password.value

            );

            rememberEmail();

            statusMessage.style.color = "#16A34A";

            statusMessage.textContent =
                "Authentication successful. Redirecting...";

            setTimeout(() => {

                window.location.href = "workspace.html";

            }, 1200);

        }

        catch (error) {

            statusMessage.style.color = "#DC2626";

            statusMessage.textContent =
                error.message || "Authentication failed.";

        }

        finally {

            setLoading(false);

        }

    });


    // -----------------------------------------------------
    // Validation
    // -----------------------------------------------------

    function validateForm() {

        let valid = true;

        if (email.value.trim() === "") {

            emailError.textContent =
                "Email address is required.";

            valid = false;

        }

        else if (!isValidEmail(email.value.trim())) {

            emailError.textContent =
                "Please enter a valid company email.";

            valid = false;

        }

        if (password.value.trim() === "") {

            passwordError.textContent =
                "Password is required.";

            valid = false;

        }

        else if (password.value.length < 8) {

            passwordError.textContent =
                "Password must contain at least 8 characters.";

            valid = false;

        }

        return valid;

    }


    // -----------------------------------------------------
    // Email Validation
    // -----------------------------------------------------

    function isValidEmail(emailAddress) {

        const regex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return regex.test(emailAddress);

    }


    // -----------------------------------------------------
    // Clear Errors
    // -----------------------------------------------------

    function clearErrors() {

        emailError.textContent = "";

        passwordError.textContent = "";

        statusMessage.textContent = "";

    }


    // -----------------------------------------------------
    // Loading
    // -----------------------------------------------------

    function setLoading(isLoading) {

        if (isLoading) {

            loginButton.disabled = true;

            loginButton.textContent =
                "Authenticating...";

            loading.classList.remove("hidden");

        }
        else {

            loginButton.disabled = false;

            loginButton.textContent =
                "Executive Login";

            loading.classList.add("hidden");

        }

    }


    // -----------------------------------------------------
    // Remember Email
    // -----------------------------------------------------

    function rememberEmail() {

        if (remember.checked) {

            localStorage.setItem(
                "epi_saved_email",
                email.value.trim()
            );

        }
        else {

            localStorage.removeItem(
                "epi_saved_email"
            );

        }

    }


    function loadRememberedEmail() {

        const savedEmail =
            localStorage.getItem(
                "epi_saved_email"
            );

        if (savedEmail) {

            email.value = savedEmail;

            remember.checked = true;

        }

    }


    // -----------------------------------------------------
    // Temporary Authentication
    // -----------------------------------------------------

    async function simulateAuthentication() {

        return new Promise((resolve, reject) => {

            setTimeout(() => {

                /*
                Replace this block with:

                AuthService.login()

                in auth.js

                */

                if (

                    email.value.trim().toLowerCase() ===
                    "admin@hargunintelligencecompass.com"

                ) {

                    resolve();

                }

                else {

                    reject(

                        new Error(

                            "Invalid email or password."

                        )

                    );

                }

            }, 1800);

        });

    }


    // -----------------------------------------------------
    // Enter Key Support
    // -----------------------------------------------------

    password.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            loginForm.requestSubmit();

        }

    });

});
