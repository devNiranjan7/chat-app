import crypto from "node:crypto";

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
        const timestamp = Math.round(Date.now() / 1000);
        const folder = `chat-app/${uid}`;
        const tags = `user-${uid}`;
        const allowedFormats = "jpg,png";
        const toSign = `allowed_formats=${allowedFormats}&folder=${folder}&tags=${tags}&timestamp=${timestamp}`;
        const signature = crypto
            .createHash("sha1")
            .update(toSign + env.CLOUDINARY_API_SECRET)
            .digest("hex");

        return res.status(200).json({
            signature,
            timestamp,
            folder,
            tags,
            allowedFormats,
            apiKey: env.CLOUDINARY_API_KEY,
            cloudName: env.CLOUDINARY_CLOUD_NAME,
        });
    } catch (error) {
        console.error("sign-upload error:", error);
        return res.status(500).json({ error: "Could not sign upload" });
    }
}
