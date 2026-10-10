import jwt from "jsonwebtoken";

import {
    createSessionToken,
    setSessionCookie,
    clearSessionCookie
} from "../utils/session.js";

import { refreshAccessToken } from "../services/tokenService.js";

// Renova o access token um pouco antes de expirar.
const EXPIRY_BUFFER_MS = 60 * 1000;

export default async function authMiddleware(
    req,
    res,
    next
) {
    const token = req.cookies.token;

    if (!token) {
        return res
            .status(401)
            .json({
                error:
                    "Unauthorized"
            });
    }

    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch {
        clearSessionCookie(res);

        return res
            .status(401)
            .json({
                error:
                    "Invalid token"
            });
    }

    try {
        const isExpired =
            !decoded.accessToken ||
            (decoded.expiresAt &&
                Date.now() >=
                    decoded.expiresAt -
                        EXPIRY_BUFFER_MS);

        if (isExpired) {
            if (!decoded.refreshToken) {
                clearSessionCookie(res);

                return res
                    .status(401)
                    .json({
                        error:
                            "Session expired"
                    });
            }

            const data =
                await refreshAccessToken(
                    decoded.refreshToken
                );

            const {
                iat,
                exp,
                ...payload
            } = decoded;

            decoded = {
                ...payload,

                accessToken:
                    data.access_token,

                expiresAt:
                    Date.now() +
                    data.expires_in * 1000,

                refreshToken:
                    data.refresh_token ||
                    decoded.refreshToken
            };

            setSessionCookie(
                res,

                createSessionToken(
                    {
                        ...payload,
                        accessToken:
                            decoded.accessToken,
                        expiresAt:
                            decoded.expiresAt,
                        refreshToken:
                            decoded.refreshToken
                    }
                )
            );
        }

        req.user = decoded;

        next();
    } catch {
        clearSessionCookie(res);

        return res
            .status(401)
            .json({
                error:
                    "Session expired"
            });
    }
}
