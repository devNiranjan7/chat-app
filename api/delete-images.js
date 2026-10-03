import { Buffer } from "node:buffer";

export default async function handler(req, res) {
    const env = globalThis.process?.env ?? {};
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    try {
        const authHeader = req.headers.authorization || "";
        const idToken = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : "";
        if (!idToken) {
            return res.status(401).json({ error: "Missing token" });
        }
        const lookup = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.VITE_FIREBASE_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            },
        );
        if (!lookup.ok) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const lookupData = await lookup.json();
        const account = lookupData.users?.[0];
        const uid = account?.localId;
        if (!uid) {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (!account.emailVerified) {
            return res.status(403).json({ error: "Verify your email first" });
        }

        const basicAuth = Buffer.from(
            `${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`,
        ).toString("base64");
        const tag = encodeURIComponent(`user-${uid}`);

        let deleted = 0;
        let nextCursor;
        let rounds = 0;
        do {
            const params = new URLSearchParams({ invalidate: "true" });
            if (nextCursor) {
                params.set("next_cursor", nextCursor);
            }
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/image/tags/${tag}?${params}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Basic ${basicAuth}` },
                },
            );
            const data = await response.json();
            if (!response.ok) {
                console.error("Cloudinary delete failed:", data);
                return res.status(502).json({ error: "Could not delete images" });
            }
            deleted += Object.keys(data.deleted ?? {}).length;
            nextCursor = data.next_cursor;
            rounds += 1;
        } while (nextCursor && rounds < 10);

        return res.status(200).json({ deleted, more: Boolean(nextCursor) });
    } catch (error) {
        console.error("delete-images error:", error);
        return res.status(500).json({ error: "Could not delete images" });
    }
}