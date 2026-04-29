import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// CREATE TABLE test_results (
//   id SERIAL PRIMARY KEY,
//   name TEXT,
//   test_type TEXT,
//   grid_type TEXT,
//   advanced_settings TEXT,
//   grid TEXT,
//   responses TEXT,
//   calibration_gain REAL,
//   masker_info TEXT
// );

export async function GET() {
  const result = await sql`
    SELECT
      id,
      name,
      test_type        AS "testType",
      grid_type        AS "gridType",
      advanced_settings AS "advancedSettings",
      grid,
      responses,
      calibration_gain AS "calibrationGain",
      masker_info      AS "maskerInfo"
    FROM test_results
    ORDER BY id DESC
  `;
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  await sql`
    INSERT INTO test_results
      (name, test_type, grid_type, advanced_settings, grid, responses, calibration_gain, masker_info)
    VALUES
      (${body.name}, ${body.testType}, ${body.gridType}, ${body.advancedSettings},
       ${body.grid}, ${body.responses}, ${body.calibrationGain}, ${body.maskerInfo})
  `;
  return NextResponse.json({ success: true });
}
