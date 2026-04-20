import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import type { AuthenticatedUser } from "@/lib/auth-types";
import { TEST_CREDENTIAL } from "@/lib/auth-types";
import { getPrisma, isSqliteNativeBindingError } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);

const HASH_PREFIX = "scrypt";
const HASH_KEY_LENGTH = 64;

const CREATE_LOCAL_CREDENTIALS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS local_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    isActive BOOLEAN NOT NULL DEFAULT 1
  )
`;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, HASH_KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}$${salt}$${derivedKey.toString("base64url")}`;
}

async function verifyPassword(
  password: string,
  storedPassword: string,
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  const [prefix, salt, hash] = storedPassword.split("$");

  if (prefix === HASH_PREFIX && salt && hash) {
    const derivedKey = (await scrypt(password, salt, HASH_KEY_LENGTH)) as Buffer;
    const storedHash = Buffer.from(hash, "base64url");

    if (storedHash.length !== derivedKey.length) {
      return {
        isValid: false,
        needsRehash: false,
      };
    }

    return {
      isValid: timingSafeEqual(storedHash, derivedKey),
      needsRehash: false,
    };
  }

  return {
    isValid: storedPassword === password,
    needsRehash: storedPassword === password,
  };
}

async function ensureLocalCredentialsTable(): Promise<void> {
  const prisma = await getPrisma();
  await prisma.$executeRawUnsafe(CREATE_LOCAL_CREDENTIALS_TABLE_SQL);
}

export async function ensureTestCredential(): Promise<AuthenticatedUser> {
  await ensureLocalCredentialsTable();

  const prisma = await getPrisma();
  const existingCredential = await prisma.localCredential.findFirst({
    where: {
      username: TEST_CREDENTIAL.username,
    },
    orderBy: {
      id: "desc",
    },
  });

  const hashedPassword = await hashPassword(TEST_CREDENTIAL.password);

  if (!existingCredential) {
    const createdCredential = await prisma.localCredential.create({
      data: {
        username: TEST_CREDENTIAL.username,
        password: hashedPassword,
        isActive: true,
      },
    });

    return {
      id: createdCredential.id,
      username: createdCredential.username,
    };
  }

  const passwordCheck = await verifyPassword(TEST_CREDENTIAL.password, existingCredential.password);

  if (!existingCredential.isActive || !passwordCheck.isValid || passwordCheck.needsRehash) {
    const updatedCredential = await prisma.localCredential.update({
      where: {
        id: existingCredential.id,
      },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });

    return {
      id: updatedCredential.id,
      username: updatedCredential.username,
    };
  }

  return {
    id: existingCredential.id,
    username: existingCredential.username,
  };
}

export async function authenticateLocalCredential(
  username: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  await ensureLocalCredentialsTable();

  const normalizedUsername = username.trim();

  if (!normalizedUsername || !password) {
    return null;
  }

  const prisma = await getPrisma();
  const credential = await prisma.localCredential.findFirst({
    where: {
      username: normalizedUsername,
      isActive: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  if (!credential) {
    return null;
  }

  const passwordCheck = await verifyPassword(password, credential.password);

  if (!passwordCheck.isValid) {
    return null;
  }

  if (passwordCheck.needsRehash) {
    await prisma.localCredential.update({
      where: {
        id: credential.id,
      },
      data: {
        password: await hashPassword(password),
      },
    });
  }

  return {
    id: credential.id,
    username: credential.username,
  };
}

export { isSqliteNativeBindingError };
