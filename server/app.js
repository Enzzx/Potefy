import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import spotifyRoutes from "./routes/spotifyRoutes.js";

dotenv.config();

const app = express();

app.use(
    cors({
        origin:
            process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/spotify",
    spotifyRoutes
);

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Server running on ${PORT}`
    );
});