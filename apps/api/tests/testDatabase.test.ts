import { getIsolatedTestDatabaseUrl } from "./helpers/testDatabase";

describe("getIsolatedTestDatabaseUrl", () => {
  it("accepts a PostgreSQL URL whose database name is clearly test-only", () => {
    expect(
      getIsolatedTestDatabaseUrl(
        "postgresql://test:test@localhost:5432/supportdesk_test_day11"
      )
    ).toBe(
      "postgresql://test:test@localhost:5432/supportdesk_test_day11"
    );
  });

  it("rejects a development or production database name", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl(
        "postgresql://test:test@localhost:5432/supportdesk"
      )
    ).toThrow(/test segment/i);
  });

  it("requires an explicit test URL instead of falling back to DATABASE_URL", () => {
    expect(() => getIsolatedTestDatabaseUrl(undefined)).toThrow(
      /TEST_DATABASE_URL/
    );
  });
});
