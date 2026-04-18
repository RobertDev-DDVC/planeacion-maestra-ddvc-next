import "server-only";

const GRAPH_API_BASE_URL = "https://graph.microsoft.com/v1.0";
const GRAPH_TOKEN_SCOPE_DEFAULT = "https://graph.microsoft.com/.default";
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

type TokenCacheEntry = {
  accessToken: string;
  cacheKey: string;
  expiresAt: number;
};

type FolderTargetCacheEntry = {
  driveId: string;
  itemId: string;
  shareUrl: string;
};

type SharePointConfig =
  | {
      authMode: "client_credentials";
      clientId: string;
      clientSecret: string;
      scopes: string;
      shareUrl: string;
      tenantId: string;
    }
  | {
      authMode: "ropc";
      clientId: string;
      clientSecret?: string;
      password: string;
      scopes: string;
      shareUrl: string;
      tenantId: string;
      username: string;
    };

type GraphTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number | string;
  expires_on?: number | string;
};

type SharedDriveItemResponse = {
  id?: string;
  name?: string;
  parentReference?: {
    driveId?: string;
  };
  remoteItem?: {
    id?: string;
    parentReference?: {
      driveId?: string;
    };
  };
};

export type SharePointSyncResult =
  | {
      skipped: true;
      synced: false;
    }
  | {
      synced: true;
    };

let cachedToken = null as TokenCacheEntry | null;
let cachedFolderTarget = null as FolderTargetCacheEntry | null;
const configWarnings = new Set<string>();

function warnOnce(key: string, message: string) {
  if (configWarnings.has(key)) {
    return;
  }

  configWarnings.add(key);
  console.warn(message);
}

function readEnv(name: string) {
  const value = process.env[name];
  return value?.trim() || "";
}

function getSharePointConfig(): SharePointConfig | null {
  const shareUrl = readEnv("SHAREPOINT_LOGS_SHARE_URL");
  const tenantId = readEnv("GRAPH_TENANT_ID");
  const clientId = readEnv("GRAPH_CLIENT_ID");
  const authModeValue =
    readEnv("SHAREPOINT_AUTH_MODE") || "client_credentials";
  const scopes = readEnv("GRAPH_SCOPES") || GRAPH_TOKEN_SCOPE_DEFAULT;

  if (!shareUrl) {
    warnOnce(
      "missing_share_url",
      "SharePoint log sync skipped: SHAREPOINT_LOGS_SHARE_URL is not configured.",
    );
    return null;
  }

  if (!tenantId || !clientId) {
    warnOnce(
      "missing_graph_core_config",
      "SharePoint log sync skipped: GRAPH_TENANT_ID and GRAPH_CLIENT_ID are required.",
    );
    return null;
  }

  if (authModeValue !== "client_credentials" && authModeValue !== "ropc") {
    warnOnce(
      "invalid_auth_mode",
      `SharePoint log sync skipped: unsupported SHAREPOINT_AUTH_MODE "${authModeValue}".`,
    );
    return null;
  }

  if (authModeValue === "client_credentials") {
    const clientSecret = readEnv("GRAPH_CLIENT_SECRET");

    if (!clientSecret) {
      warnOnce(
        "missing_client_secret",
        "SharePoint log sync skipped: GRAPH_CLIENT_SECRET is required for client_credentials mode.",
      );
      return null;
    }

    return {
      authMode: "client_credentials",
      clientId,
      clientSecret,
      scopes,
      shareUrl,
      tenantId,
    };
  }

  const username = readEnv("GRAPH_USERNAME");
  const password = readEnv("GRAPH_PASSWORD");
  const clientSecret = readEnv("GRAPH_CLIENT_SECRET");

  if (!username || !password) {
    warnOnce(
      "missing_ropc_credentials",
      "SharePoint log sync skipped: GRAPH_USERNAME and GRAPH_PASSWORD are required for ropc mode.",
    );
    return null;
  }

  return {
    authMode: "ropc",
    clientId,
    clientSecret: clientSecret || undefined,
    password,
    scopes,
    shareUrl,
    tenantId,
    username,
  };
}

function getTokenCacheKey(config: SharePointConfig) {
  if (config.authMode === "client_credentials") {
    return [
      config.authMode,
      config.tenantId,
      config.clientId,
      config.scopes,
    ].join(":");
  }

  return [
    config.authMode,
    config.tenantId,
    config.clientId,
    config.username,
    config.scopes,
  ].join(":");
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function readResponseText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function getTokenEndpoint(tenantId: string) {
  return `https://login.microsoftonline.com/${encodeURIComponent(
    tenantId,
  )}/oauth2/v2.0/token`;
}

async function getGraphAccessToken(config: SharePointConfig) {
  const cacheKey = getTokenCacheKey(config);

  if (
    cachedToken &&
    cachedToken.cacheKey === cacheKey &&
    cachedToken.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS
  ) {
    return cachedToken.accessToken;
  }

  const body = new URLSearchParams();
  body.set("client_id", config.clientId);
  body.set("scope", config.scopes);

  if (config.authMode === "client_credentials") {
    body.set("grant_type", "client_credentials");
    body.set("client_secret", config.clientSecret);
  } else {
    body.set("grant_type", "password");
    body.set("username", config.username);
    body.set("password", config.password);

    if (config.clientSecret) {
      body.set("client_secret", config.clientSecret);
    }
  }

  const response = await fetch(getTokenEndpoint(config.tenantId), {
    body,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorBody = await readResponseText(response);
    throw new Error(
      `Microsoft Graph token request failed: ${response.status} ${response.statusText} ${errorBody}`,
    );
  }

  const tokenResponse = await parseJsonResponse<GraphTokenResponse>(response);
  const accessToken = tokenResponse.access_token;

  if (!accessToken) {
    throw new Error(
      `Microsoft Graph token response did not include an access token: ${JSON.stringify(
        tokenResponse,
      )}`,
    );
  }

  const expiresInSeconds = Number(
    tokenResponse.expires_in ||
      Number(tokenResponse.expires_on || 0) - Math.floor(Date.now() / 1000),
  );
  const safeExpiresInSeconds = Number.isFinite(expiresInSeconds)
    ? Math.max(expiresInSeconds, 300)
    : 3600;

  cachedToken = {
    accessToken,
    cacheKey,
    expiresAt: Date.now() + safeExpiresInSeconds * 1000,
  };

  return accessToken;
}

function encodeShareUrl(shareUrl: string) {
  const base64Value = Buffer.from(shareUrl, "utf8").toString("base64");
  const base64Url = base64Value
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `u!${base64Url}`;
}

async function resolveSharePointFolderTarget(config: SharePointConfig) {
  if (cachedFolderTarget && cachedFolderTarget.shareUrl === config.shareUrl) {
    return cachedFolderTarget;
  }

  const accessToken = await getGraphAccessToken(config);
  const shareId = encodeShareUrl(config.shareUrl);
  const response = await fetch(
    `${GRAPH_API_BASE_URL}/shares/${shareId}/driveItem?$select=id,name,parentReference`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await readResponseText(response);
    throw new Error(
      `SharePoint folder resolution failed: ${response.status} ${response.statusText} ${errorBody}`,
    );
  }

  const driveItem = await parseJsonResponse<SharedDriveItemResponse>(response);
  const driveId =
    driveItem.parentReference?.driveId ||
    driveItem.remoteItem?.parentReference?.driveId;
  const itemId = driveItem.id || driveItem.remoteItem?.id;

  if (!driveId || !itemId) {
    throw new Error(
      `SharePoint folder resolution returned an incomplete drive target: ${JSON.stringify(
        driveItem,
      )}`,
    );
  }

  cachedFolderTarget = {
    driveId,
    itemId,
    shareUrl: config.shareUrl,
  };

  return cachedFolderTarget;
}

export async function syncLogFileToSharePoint(
  fileName: string,
  content: string,
): Promise<SharePointSyncResult> {
  const config = getSharePointConfig();

  if (!config) {
    return {
      skipped: true,
      synced: false,
    };
  }

  const accessToken = await getGraphAccessToken(config);
  const folderTarget = await resolveSharePointFolderTarget(config);
  const uploadUrl = `${GRAPH_API_BASE_URL}/drives/${encodeURIComponent(
    folderTarget.driveId,
  )}/items/${encodeURIComponent(folderTarget.itemId)}:/${encodeURIComponent(
    fileName,
  )}:/content`;

  const response = await fetch(uploadUrl, {
    body: content,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain; charset=utf-8",
    },
    method: "PUT",
  });

  if (!response.ok) {
    const errorBody = await readResponseText(response);
    throw new Error(
      `SharePoint log upload failed: ${response.status} ${response.statusText} ${errorBody}`,
    );
  }

  return {
    synced: true,
  };
}
