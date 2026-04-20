export type AuthenticatedUser = {
  id: number;
  username: string;
};

export const TEST_CREDENTIAL = {
  username: "usuario.prueba",
  password: "Ddvc123!",
} as const;
