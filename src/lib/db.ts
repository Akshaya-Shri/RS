import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var _pgPool: any | undefined;
}

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'revathi_store'}`;

const pool = global._pgPool || new Pool({
  connectionString,
  max: 10,
});

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

export default pool;
