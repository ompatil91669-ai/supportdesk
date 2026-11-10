
import { parse } from "csv-parse/sync";

const REQUIRED_HEADERS = ["id", "name", "email", "status"];
const VALID_STATUSES = ["Open", "Closed", "Pending"];

export function csvToJson(csv: string): Record<string, string>[] {
  if (!csv.trim()) {
    throw new Error("CSV input cannot be empty");
  }

  let rows: string[][];

  try {
    rows = parse(csv, {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    }) as string[][];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid CSV format";

    throw new Error(`Invalid CSV format: ${message}`);
  }

  if (rows.length === 0) {
    throw new Error("CSV input cannot be empty");
  }

  const headers = rows[0].map(header => header.trim());

  const missingHeaders = REQUIRED_HEADERS.filter(
    header => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required columns: ${missingHeaders.join(", ")}`
    );
  }

  const duplicateHeaders = headers.filter(
    (header, index) => headers.indexOf(header) !== index
  );

  if (duplicateHeaders.length > 0) {
    throw new Error("Duplicate column headers are not allowed");
  }

  return rows.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Invalid number of values in row ${index + 2}`
      );
    }

    const record: Record<string, string> = {};

    headers.forEach((header, i) => {
      record[header] = values[i].trim();
    });

    for (const header of REQUIRED_HEADERS) {
      if (!record[header]) {
        throw new Error(
          `Required field '${header}' is empty in row ${index + 2}`
        );
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      throw new Error(`Invalid email in row ${index + 2}`);
    }

    if (!VALID_STATUSES.includes(record.status)) {
      throw new Error(`Invalid status in row ${index + 2}`);
    }

    return record;
  });
}
