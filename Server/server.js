import app from "./app.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {

    console.log("");
    console.log("================================================");
    console.log(" Enterprise Performance Intelligence™");
    console.log(" Hargun Intelligence Compass");
    console.log("================================================");
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("================================================");
    console.log("");

});

server.on("error", (error) => {

    console.error("SERVER ERROR:");
    console.error(error);

});

process.on("uncaughtException", (error) => {

    console.error("UNCAUGHT EXCEPTION:");
    console.error(error);

});

process.on("unhandledRejection", (error) => {

    console.error("UNHANDLED REJECTION:");
    console.error(error);

});

