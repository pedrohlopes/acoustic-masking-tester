import { createClient } from "@libsql/client";
console.log(process.env);

const client = createClient({
  url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || "",
  authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
});

client.execute("SELECT * FROM my_database").then((result) => {
  console.log(result);
} )


const createTable = async (tableName: string, fields: Object) => {
  const fieldsString = Object.entries(fields).map(([name, type]) => `${name} ${type}`).join(", ");
  const query = `CREATE TABLE ${tableName} (${fieldsString})`;
  await client.execute(query);
} 
const insertRow = async (tableName: string, values: Object) => {
  const columns = Object.keys(values).join(", ");
  const valuesString = Object.values(values).map((value) => `'${value}'`).join(", ");
  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${valuesString})`;
  await client.execute(query);
}
const selectRows = async (tableName: string, columns: string[], where: string) => {
  const columnsString = columns.join(", ");
  const query = `SELECT ${columnsString} FROM ${tableName} WHERE ${where}`;
  const result = await client.execute(query);
  return result;
}

export { createTable };