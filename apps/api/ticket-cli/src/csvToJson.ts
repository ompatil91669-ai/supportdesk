export function csvToJson(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",");

    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() ?? "";
    });

    return record;
  });
}