import * as lancedb from 'vectordb';
import path from 'path';

const dbPath = path.join(process.cwd(), '.lancedb');
let db: lancedb.Connection | null = null;

export const getLanceDB = async () => {
  if (!db) {
    db = await lancedb.connect(dbPath);
    console.log(`[LanceDB] Connected to local vector database at ${dbPath}`);
  }
  return db;
};

export const getMemoriesTable = async (userId: string) => {
  const connection = await getLanceDB();
  const tableName = `memories_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  try {
    const tableNames = await connection.tableNames();
    if (tableNames.includes(tableName)) {
      return await connection.openTable(tableName);
    }
    return null;
  } catch (error) {
    console.error(`[LanceDB] Error accessing table ${tableName}:`, error);
    return null;
  }
};
