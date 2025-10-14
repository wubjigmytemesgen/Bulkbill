'use server';

import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

const host = process.env.MYSQL_HOST || '127.0.0.1';
const user = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || 'aawsa_billing';
const port = Number(process.env.MYSQL_PORT || 3306);

async function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  return pool;
}

export async function query(sql: string, params?: any[]) {
  const p = await getPool();
  try {
    const [rows] = await p.execute(sql, params || []);
    return rows as any;
  } catch (error) {
    try {
      console.error('MySQL query error', { sql, params, error: (error && typeof error === 'object') ? Object.getOwnPropertyNames(error).reduce((acc: any, k) => { acc[k] = (error as any)[k]; return acc; }, {}) : String(error) });
    } catch (logErr) {
      console.error('MySQL query error (failed to serialize)', logErr, sql, params, error);
    }
    throw error;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}