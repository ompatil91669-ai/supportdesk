export function getIsolatedTestDatabaseUrl(
  value: string | undefined
): string {
  if (!value) {
    throw new Error(
      "TEST_DATABASE_URL must point to a dedicated PostgreSQL test database"
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL");
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("TEST_DATABASE_URL must be a PostgreSQL URL");
  }

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new Error("TEST_DATABASE_URL must contain a valid database name");
  }
  if (!/(^|[_-])test($|[_-])/i.test(databaseName)) {
    throw new Error(
      "TEST_DATABASE_URL must use a database name with a distinct test segment"
    );
  }

  return value;
}
