/*
==========================================================
Enterprise Performance Intelligence™
Developer Utility

Password Hash Generator

Version 1.0

==========================================================
*/

import bcrypt from "bcrypt";
import promptSync from "prompt-sync";

const prompt = promptSync({ sigint: true });

const SALT_ROUNDS = 12;

async function main() {

    console.log("");
    console.log("==============================================");
    console.log(" Enterprise Performance Intelligence™");
    console.log(" Password Hash Generator");
    console.log("==============================================");
    console.log("");

    const password = prompt(

        "Enter administrator password: ",

        {

            echo: "*"

        }

    );

    if (!password) {

        console.log("");

        console.log("No password entered.");

        process.exit(1);

    }

    console.log("");
    console.log("Generating bcrypt hash...");
    console.log("");

    const hash = await bcrypt.hash(

        password,

        SALT_ROUNDS

    );

    console.log("----------------------------------------------");
    console.log("");

    console.log(hash);

    console.log("");

    console.log("----------------------------------------------");

    console.log("");
    console.log("Copy this hash into:");
    console.log("");
    console.log("server/.env");
    console.log("");
    console.log("ADMIN_PASSWORD_HASH=<paste hash here>");
    console.log("");

}

main().catch(console.error);
