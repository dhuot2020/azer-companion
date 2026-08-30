const crypto = require("crypto");

function getRegion() {
  return String(process.env.BATTLENET_REGION || "us").toLowerCase();
}

function getOAuthBaseUrl() {
  const region = getRegion();

  if (region === "cn") {
    return "https://www.battlenet.com.cn/oauth";
  }

  // Battle.net accepte les regions regionales pour OAuth.
  // Pour Azer Compagnion Canada, "us" est la valeur par defaut.
  return `https://${region}.battle.net/oauth`;
}

function getConfig() {
  const clientId = process.env.BATTLENET_CLIENT_ID;
  const clientSecret = process.env.BATTLENET_CLIENT_SECRET;
  const redirectUri = process.env.BATTLENET_REDIRECT_URI;

  if (!clientId) {
    throw new Error("BATTLENET_CLIENT_ID manquant.");
  }

  if (!clientSecret) {
    throw new Error("BATTLENET_CLIENT_SECRET manquant.");
  }

  if (!redirectUri) {
    throw new Error("BATTLENET_REDIRECT_URI manquant.");
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    region: getRegion(),
    baseUrl: getOAuthBaseUrl(),
  };
}

function createState() {
  return crypto.randomBytes(32).toString("hex");
}

function buildAuthorizationUrl(state) {
  const config = getConfig();

  const url = new URL(`${config.baseUrl}/authorize`);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");

  // openid = identite Battle.net
  // wow.profile = acces au profil WoW autorise par l'utilisateur
  url.searchParams.set("scope", "openid wow.profile");

  url.searchParams.set("state", state);

  return url.toString();
}

async function exchangeAuthorizationCode(code) {
  const config = getConfig();

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", config.redirectUri);

  const basicAuth = Buffer
    .from(`${config.clientId}:${config.clientSecret}`, "utf8")
    .toString("base64");

  const response = await fetch(`${config.baseUrl}/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload.error_description ||
      payload.error ||
      `Battle.net token endpoint HTTP ${response.status}`
    );

    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function getUserInfo(accessToken) {
  const config = getConfig();

  const response = await fetch(`${config.baseUrl}/userinfo`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload.error_description ||
      payload.error ||
      `Battle.net userinfo HTTP ${response.status}`
    );

    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

module.exports = {
  getConfig,
  createState,
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  getUserInfo,
};
