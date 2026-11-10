
import { generateTicketId } from "./ticketId";
import { csvToJson } from "./csvToJson";
import * as fs from "fs";

const command = process.argv[2];

try {
  if (command === "generate-id") {
    const ticketId = generateTicketId();
    console.log("Generated Ticket ID:", ticketId);

  } else if (command === "csv-to-json") {
    const inputFile = process.argv[3];
    const outputFile = process.argv[4];

    if (!inputFile || !outputFile) {
      throw new Error(
        "Usage: npm start -- csv-to-json <input.csv> <output.json>"
      );
    }

    if (!fs.existsSync(inputFile)) {
      throw new Error(`Input file not found: ${inputFile}`);
    }

    const csvData = fs.readFileSync(inputFile, "utf-8");
    const jsonData = csvToJson(csvData);

    fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));

    console.log("CSV successfully converted to JSON!");

  } else {
    console.log("Available commands:");
    console.log("1. generate-id");
    console.log("2. csv-to-json <input.csv> <output.json>");
    process.exitCode = 1;
  }

} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  console.error("Error:", message);
  process.exitCode = 1;
}
