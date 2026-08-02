import { stringify } from "csv-stringify";
import type { Response } from "express";

export function sendCsv(res: Response, filename: string, columns: string[], rows: Record<string, unknown>[]) {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  const stringifier = stringify({ header: true, columns });
  stringifier.pipe(res);
  for (const row of rows) stringifier.write(row);
  stringifier.end();
}
