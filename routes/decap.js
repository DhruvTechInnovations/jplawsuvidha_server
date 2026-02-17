require("dotenv").config();
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");


const decaprouter = express.Router();

// -----------------------------
// GLOBAL MIDDLEWARE
// -----------------------------
decaprouter.use(cookieParser());



const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI,
  FRONTEND_URL_2 = "http://localhost:3000",
  NODE_ENV = "development",
} = process.env;

const isProduction = NODE_ENV === "production";

// -----------------------------
//  START OAUTH
// -----------------------------
decaprouter.get("/auth", (req, res) => {
  console.log("[/auth] request received");

  // Generate state
  const state = crypto.randomBytes(16).toString("hex");

  // Cookie must be cross-site friendly
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: isProduction,   // ❗ localhost only (false), production (true)
    sameSite: "lax"
  });

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "repo,user",
    state,
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  console.log("[/auth] Redirecting:", url);

  return res.redirect(url);
});

// -----------------------------
//  CALLBACK (GitHub → Server)
// -----------------------------
decaprouter.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies["oauth_state"];

  console.log("[/callback] Received:", { codeExists: !!code, state, savedState });

  // Validate
  if (!code) return res.status(400).send("Missing code");
  if (!savedState || state !== savedState) {
    console.error("[/callback] STATE MISMATCH.");
    return res.status(403).send("Invalid OAuth state");
  }

  try {
    console.log("[/callback] Exchanging code → token...");
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: "application/json" } }
    );

    console.log("[/callback] Token response:", tokenResponse.data);

    const token = tokenResponse.data.access_token;
    if (!token) return res.status(401).send("Unauthorized");

    // SUCCESS message for Decap
    const payload = JSON.stringify({
      token,
      provider: "github",
    });

    const msg = `authorization:github:success:${payload}`;
    console.log('mesage', msg)

    // Popup window HTML
    const html = `
<!doctype html>
<html>
  <body>
    <script>
      console.log("Decap OAuth callback loaded");

      // Notify CMS we're ready
      window.opener.postMessage("authorizing:github", "${FRONTEND_URL_2}");

      // Send token
      console.log("Sending token back to opener…");
      window.opener.postMessage(${JSON.stringify(msg)}, "${FRONTEND_URL_2}");
      console.log("message sent")

      // Close popup
      window.close();
    </script>
  </body> 
</html>`;
    console.log('html sent')
    res.send(html);
  } catch (err) {
    console.error("[/callback] OAuth Error:", err.response?.data || err);
    res.status(500).send("OAuth error");
  }
});

module.exports = decaprouter;