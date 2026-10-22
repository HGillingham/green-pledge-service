import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import morgan from "morgan";
import Router from "./views/router.js";

const port = process.env.PORT || 3000;
const app = express();

// Comma-separated list of front-end URLs allowed to call the API
const allowedOrigins = (
    process.env.FRONTEND_ORIGIN || "http://localhost:5173"
).split(",");

app.use(cors({ origin: allowedOrigins })); //lets the browser accept the response
app.use(morgan("dev")); //logs each request in the terminal
app.use(express.json());
app.use(Router);

// error handler, needs to be after the router.
// Controllers call next(err), without this, Express replies with an HTML
// error page that the front end can't read

app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Oh no something went wrong on the server" });
});

async function startServer() {
    try {
        app.listen(port, () => console.log(`Listening on Port: ${port}`));
    } catch (err) {
        console.log("Oh no something went wrong", err);
    }
}

startServer();