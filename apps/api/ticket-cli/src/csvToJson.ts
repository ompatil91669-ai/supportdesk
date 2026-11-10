const REQUIRED_HEADERS = ["id", "name", "email", "status"];
const VALID_STATUSES = ["Open", "Closed", "Pending"];

export function csvToJson(csv: string): Record<string, string>[] {
  if (!csv.trim()) {
    throw new Error("CSV input cannot be empty");
  }

  const lines = csv.trim().split(/\r?\n/);

  const headers = lines[0].split(",").map(header => header.trim());

  const missingHeaders = REQUIRED_HEADERS.filter(
    header => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
  }

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map(value => value.trim());

    if (values.length !== headers.length) {
      throw new Error(`Invalid number of values in row ${index + 2}`);
    }

    const record: Record<string, string> = {};

    headers.forEach((header, i) => {
      record[header] = values[i];
    });

    for (const header of REQUIRED_HEADERS) {
      if (!record[header]) {
        throw new Error(`Required field '${header}' is empty in row ${index + 2}`);
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