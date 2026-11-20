process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "supportdesk-test-secret-only-not-for-production";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://test:test@localhost:5432/supportdesk_test_placeholder";
