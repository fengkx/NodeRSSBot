import { config } from '../config';
import { Pool } from 'better-sqlite-pool';

const dbPool = new Pool(config.db_path);
export default dbPool;
