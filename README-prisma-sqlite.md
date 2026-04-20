# Prisma + SQLite local

Este proyecto ahora queda preparado para usar Prisma con un archivo SQLite local.

## Ruta local del archivo

Por defecto el archivo se crea en:

`%APPDATA%/pm-ddvc/data/local-credentials.sqlite`

Si quieres otra ruta, define `PM_SQLITE_PATH` en tu `.env`.

## Campos creados

La tabla `local_credentials` contiene:

- `id`
- `username`
- `password`
- `date`
- `isActive`

## Flujo inicial

### Prerequisito en Windows

`better-sqlite3` necesita que los scripts de instalación estén habilitados. Si tu entorno tiene `ignore-scripts=true`, el archivo nativo `better_sqlite3.node` no se generará y el login fallará al intentar abrir SQLite.

Antes de instalar o reconstruir dependencias, confirma que este workspace tenga:

`ignore-scripts=false`

1. Instala dependencias:
   `pnpm install`
2. Genera Prisma Client:
   `pnpm prisma:generate`
3. Crea o sincroniza el schema en el archivo SQLite:
   `pnpm prisma:push`

Si solo quieres preparar la carpeta local antes de crear la base:

`pnpm sqlite:prepare`

Si en tu máquina `prisma db push` falla por runtime del schema engine, puedes inicializar el archivo igual con:

`pnpm sqlite:init`

Si el binding nativo de `better-sqlite3` falta o quedó corrupto:

1. Verifica `pnpm config get ignore-scripts`
2. Ejecuta `pnpm rebuild better-sqlite3`
3. Si sigue fallando, reinstala dependencias con scripts habilitados

## Descargar desde SharePoint

1. Configura `SHAREPOINT_DOWNLOAD_URL`
2. Configura autenticación `client_credentials` con:
   `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` y `SHAREPOINT_TOKEN_SCOPE`
3. Si tu entorno ya te entrega el token o usa cookie, también puedes usar `SHAREPOINT_AUTH_TOKEN` o `SHAREPOINT_COOKIE`
4. Ejecuta:
   `pnpm sqlite:download`

## Subir a SharePoint

1. Configura `SHAREPOINT_UPLOAD_URL`
2. Configura autenticación `client_credentials` con:
   `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` y `SHAREPOINT_TOKEN_SCOPE`
3. Si tu entorno ya te entrega el token o usa cookie, también puedes usar `SHAREPOINT_AUTH_TOKEN` o `SHAREPOINT_COOKIE`
4. Ejecuta:
   `pnpm sqlite:upload`

## Comando para insertar registros

`pnpm sqlite:add --username admin --password 123456 --date 2026-04-18T10:00:00.000Z --isActive true`

Si no envías `--date`, se usa la fecha actual. Si no envías `--isActive`, se guarda `true`.
