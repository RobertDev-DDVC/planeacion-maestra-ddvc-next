import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function getArgument(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function getCommand() {
  return process.argv[2];
}

function resolveSqliteFilePath() {
  const appDataDirectory =
    process.env.APPDATA ??
    path.join(process.env.USERPROFILE ?? "C:\\Users\\Public", "AppData", "Roaming");

  const defaultDatabasePath = path.join(
    appDataDirectory,
    "pm-ddvc",
    "data",
    "local-credentials.sqlite",
  );

  return path.resolve(
    process.env.LOCAL_SQLITE_CACHE_PATH ?? process.env.PM_SQLITE_PATH ?? defaultDatabasePath,
  );
}

function encodeShareUrl(shareUrl) {
  return `u!${Buffer.from(shareUrl, "utf8")
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("/", "_")
    .replaceAll("+", "-")}`;
}

function getGraphBaseUrl() {
  return process.env.GRAPH_BASE_URL ?? "https://graph.microsoft.com/v1.0";
}

function getConfiguredShareUrl() {
  return getArgument("--share-url") ?? process.env.SHAREPOINT_SQLITE_SHARE_URL;
}

function buildHeaders(defaultHeaders = {}) {
  const headers = new Headers(defaultHeaders);
  const token = getArgument("--token") ?? process.env.SHAREPOINT_AUTH_TOKEN;
  const cookie = getArgument("--cookie") ?? process.env.SHAREPOINT_COOKIE;
  const extraHeaders = process.env.SHAREPOINT_EXTRA_HEADERS;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (cookie) {
    headers.set("Cookie", cookie);
  }

  if (extraHeaders) {
    const parsedHeaders = JSON.parse(extraHeaders);

    for (const [key, value] of Object.entries(parsedHeaders)) {
      headers.set(key, String(value));
    }
  }

  return headers;
}

async function getAccessToken() {
  const directToken = getArgument("--token") ?? process.env.SHAREPOINT_AUTH_TOKEN;

  if (directToken) {
    return directToken;
  }

  const tenantId = process.env.AZURE_TENANT_ID ?? process.env.GRAPH_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID ?? process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET ?? process.env.GRAPH_CLIENT_SECRET;
  const scope = process.env.SHAREPOINT_TOKEN_SCOPE ?? process.env.GRAPH_SCOPES;
  const resource = process.env.SHAREPOINT_TOKEN_RESOURCE;
  const tokenUrl =
    process.env.SHAREPOINT_TOKEN_URL ??
    (tenantId
      ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
      : undefined);

  if (!tokenUrl || !clientId || !clientSecret || (!scope && !resource)) {
    return undefined;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  if (scope) {
    body.set("scope", scope);
  }

  if (resource) {
    body.set("resource", resource);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `No pude obtener el token OAuth (${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  const payload = await response.json();

  if (!payload.access_token || typeof payload.access_token !== "string") {
    throw new Error("La respuesta del token no incluyó access_token.");
  }

  return payload.access_token;
}

async function buildAuthenticatedHeaders(defaultHeaders = {}) {
  const headers = buildHeaders(defaultHeaders);
  const token = await getAccessToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function fetchSharedDriveItem() {
  const shareUrl = getConfiguredShareUrl();

  if (!shareUrl) {
    return undefined;
  }

  const encodedShareUrl = encodeShareUrl(shareUrl);
  const response = await fetch(`${getGraphBaseUrl()}/shares/${encodedShareUrl}/driveItem`, {
    method: "GET",
    headers: await buildAuthenticatedHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `No pude resolver el archivo compartido (${response.status} ${response.statusText}).`,
    );
  }

  return response.json();
}

async function downloadSqliteFile() {
  const url = getArgument("--url") ?? process.env.SHAREPOINT_DOWNLOAD_URL;
  const filePath = path.resolve(getArgument("--out") ?? resolveSqliteFilePath());

  await mkdir(path.dirname(filePath), { recursive: true });

  const shareUrl = getConfiguredShareUrl();
  const resolvedUrl =
    url ??
    (shareUrl
      ? `${getGraphBaseUrl()}/shares/${encodeShareUrl(shareUrl)}/driveItem/content`
      : undefined);

  if (!resolvedUrl) {
    throw new Error(
      "Falta la URL de descarga. Usa SHAREPOINT_DOWNLOAD_URL o SHAREPOINT_SQLITE_SHARE_URL.",
    );
  }

  const response = await fetch(resolvedUrl, {
    method: "GET",
    headers: await buildAuthenticatedHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Descarga fallida (${response.status} ${response.statusText}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);

  console.log(`SQLite descargado en: ${filePath}`);
}

async function uploadSqliteFile() {
  const url = getArgument("--url") ?? process.env.SHAREPOINT_UPLOAD_URL;
  const filePath = path.resolve(getArgument("--file") ?? resolveSqliteFilePath());
  const method = getArgument("--method") ?? process.env.SHAREPOINT_UPLOAD_METHOD ?? "PUT";

  const fileBuffer = await readFile(filePath);
  const shareDriveItem = url ? undefined : await fetchSharedDriveItem();
  const driveId = shareDriveItem?.parentReference?.driveId;
  const itemId = shareDriveItem?.id;
  const resolvedUrl =
    url ??
    (driveId && itemId
      ? `${getGraphBaseUrl()}/drives/${driveId}/items/${itemId}/content`
      : undefined);

  if (!resolvedUrl) {
    throw new Error(
      "Falta la URL de subida. Usa SHAREPOINT_UPLOAD_URL o SHAREPOINT_SQLITE_SHARE_URL.",
    );
  }

  const response = await fetch(resolvedUrl, {
    method,
    headers: await buildAuthenticatedHeaders({
      "Content-Type": "application/octet-stream",
    }),
    body: fileBuffer,
  });

  if (!response.ok) {
    throw new Error(`Subida fallida (${response.status} ${response.statusText}).`);
  }

  console.log(`SQLite subido desde: ${filePath}`);
}

async function main() {
  const command = getCommand();

  if (command === "download") {
    await downloadSqliteFile();
    return;
  }

  if (command === "upload") {
    await uploadSqliteFile();
    return;
  }

  throw new Error("Uso: pnpm sqlite:download o pnpm sqlite:upload");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
