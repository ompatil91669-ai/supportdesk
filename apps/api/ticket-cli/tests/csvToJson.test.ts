import { csvToJson } from "../src/csvToJson";

describe("csvToJson", () => {
  test("should convert valid CSV into JSON", () => {
    const csv =
      "id,name,email,status\n1,Om,om@gmail.com,Open";

    expect(csvToJson(csv)).toEqual([
      {
        id: "1",
        name: "Om",
        email: "om@gmail.com",
        status: "Open"
      }
    ]);
  });

  test("should map headers and values correctly", () => {
    const csv =
      "id,name,email,status\n1,Rahul,rahul@gmail.com,Closed";

    const result = csvToJson(csv);

    expect(result[0].name).toBe("Rahul");
    expect(result[0].status).toBe("Closed");
  });

  test("should reject empty CSV", () => {
    expect(() => csvToJson("")).toThrow();
  });

  test("should reject missing required columns", () => {
    const csv = "id,name\n1,Om";

    expect(() => csvToJson(csv)).toThrow(/missing|required/i);
  });

  test("should reject rows with missing values", () => {
    const csv =
      "id,name,email,status\n1,Om,om@gmail.com";

    expect(() => csvToJson(csv)).toThrow();
  });

  test("should reject rows with extra values", () => {
    const csv =
      "id,name,email,status\n1,Om,om@gmail.com,Open,Extra";

    expect(() => csvToJson(csv)).toThrow();
  });

  test("should reject empty required values", () => {
    const csv =
      "id,name,email,status\n1,,om@gmail.com,Open";

    expect(() => csvToJson(csv)).toThrow();
  });

  test("should reject invalid email", () => {
    const csv =
      "id,name,email,status\n1,Om,invalid-email,Open";

    expect(() => csvToJson(csv)).toThrow(/email/i);
  });

  test("should reject invalid status", () => {
    const csv =
      "id,name,email,status\n1,Om,om@gmail.com,Done";

    expect(() => csvToJson(csv)).toThrow(/status/i);
  });

  test("should accept all three valid statuses", () => {
    const csv =
      "id,name,email,status\n" +
      "1,Om,om@gmail.com,Open\n" +
      "2,Rahul,rahul@gmail.com,Closed\n" +
      "3,Amit,amit@gmail.com,Pending";

    expect(csvToJson(csv)).toHaveLength(3);
  });
  test("should handle commas inside quoted values", () => {
    const csv =
      'id,name,email,status\n1,"Patil, Om",om@gmail.com,Open';

    expect(csvToJson(csv)).toEqual([
      {
        id: "1",
        name: "Patil, Om",
        email: "om@gmail.com",
        status: "Open"
      }
    ]);
  });});