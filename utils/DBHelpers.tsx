import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || "",
  authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
});

client.execute("SELECT * FROM test_results").then((result) => {
  console.log(result);
} )


const createTable = async (tableName: string, fields: Object) => {
  const fieldsString = Object.entries(fields).map(([name, type]) => `${name} ${type}`).join(", ");
  const query = `CREATE TABLE ${tableName} (${fieldsString})`;
  await client.execute(query);
} 
const dropTable = async (tableName: string) => {
  const query = `DROP TABLE ${tableName}`;
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
const deleteRow = async (tableName: string, id: number) => {
  const query = `DELETE FROM ${tableName} WHERE id = ${id}`;
  await client.execute(query);
}

const updateRow = async (tableName: string, id: number, values: Object) => {
  const valuesString = Object.entries(values).map(([name, value]) => `${name} = '${value}'`).join(", ");
  const query = `UPDATE ${tableName} SET ${valuesString} WHERE id = ${id}`;
  await client.execute(query);
}


export { createTable,dropTable, insertRow, selectRows, deleteRow, updateRow };