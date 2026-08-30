function getRegion() {
  return String(process.env.BATTLENET_REGION || "us").toLowerCase();
}

function getLocale() {
  return process.env.BATTLENET_LOCALE || "fr_FR";
}

function getRetailNamespace() {
  return `profile-${getRegion()}`;
}

function getApiBaseUrl() {
  return `https://${getRegion()}.api.blizzard.com`;
}

async function battleNetApiGet(pathname, accessToken, {
  namespace = getRetailNamespace(),
  locale = getLocale(),
} = {}) {
  const url = new URL(`${getApiBaseUrl()}${pathname}`);

  if (namespace) {
    url.searchParams.set("namespace", namespace);
  }

  if (locale) {
    url.searchParams.set("locale", locale);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload.detail ||
      payload.title ||
      `Battle.net API HTTP ${response.status}`
    );

    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function getRetailAccountProfile(accessToken) {
  return battleNetApiGet(
    "/profile/user/wow",
    accessToken,
    {
      namespace: getRetailNamespace(),
      locale: getLocale(),
    }
  );
}

module.exports = {
  getRetailAccountProfile,
  battleNetApiGet,
};
