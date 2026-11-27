import { createSwaggerDocument } from "../src/docs/swagger";

describe("createSwaggerDocument", () => {
  it("documents every implemented API route", () => {
    const { paths } = createSwaggerDocument();

    expect(Object.keys(paths).sort()).toEqual([
      "/auth/login",
      "/auth/register",
      "/health",
      "/tickets",
      "/tickets/{id}",
      "/tickets/{id}/ai/categorise",
      "/tickets/{id}/ai/suggest-reply",
      "/tickets/{id}/comments",
      "/users",
      "/users/agents",
      "/users/{id}",
    ]);
  });

  it("declares JWT bearer authentication for protected endpoints", () => {
    const document = createSwaggerDocument();

    expect(document.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
    expect(document.paths["/tickets"].get?.security).toEqual([
      { bearerAuth: [] },
    ]);
  });
});
