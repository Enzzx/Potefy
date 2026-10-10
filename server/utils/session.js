import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "token";

const SESSION_TTL = "7d";

export function createSessionToken(payload) {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: SESSION_TTL
        }
    );
}

export function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });
}

export function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE);
}
