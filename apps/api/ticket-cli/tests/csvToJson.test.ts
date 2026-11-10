import { csvToJson } from "../src/csvToJson";

describe("csvToJson", () => {
  test("should convert CSV rows into JSON objects", () => {
    const csv = "id,name\n1,Om\n2,Rahul";

    expect(csvToJson(csv)).toEqual([
      { id: "1", name: "Om" },
      { id: "2", name: "Rahul" }
    ]);
  });

  test("should use the first row as headers", () => {
    const csv = "name,city\nOm,Pune";

    const result = csvToJson(csv);

    expect(Object.keys(result[0])).toEqual(["name", "city"]);
  });

  test("should return an empty array for empty CSV", () => {
    expect(csvToJson("")).toEqual([]);
  });

  test("should trim spaces around values", () => {
    const csv = "name,city\n Om , Pune ";

    expect(csvToJson(csv)).toEqual([
      { name: "Om", city: "Pune" }
    ]);
  });
});