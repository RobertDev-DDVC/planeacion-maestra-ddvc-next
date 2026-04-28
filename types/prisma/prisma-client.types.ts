export type PrismaModule = typeof import("@/generated/prisma/client");
export type PrismaClientInstance = InstanceType<PrismaModule["PrismaClient"]>;

