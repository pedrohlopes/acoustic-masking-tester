export const insertRow = async (_tableName: string, values: Record<string, unknown>) => {
  await fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
};

export { };
