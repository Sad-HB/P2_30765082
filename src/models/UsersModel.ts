import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcrypt';

export interface User {
  id?: number;
  username: string;
  password_hash: string;
  created_at?: string;
}

export class UsersModel {
  private db: Database<sqlite3.Database, sqlite3.Statement>;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>) {
    this.db = db;
  }

  static async initialize(dbPath: string) {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    await db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
    return new UsersModel(db);
  }

  async createUser(username: string, password: string) {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await this.db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      username,
      password_hash
    );
    return { id: result.lastID, username, password_hash };
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.db.get('SELECT * FROM users WHERE username = ?', username);
  }

  async findById(id: number): Promise<User | undefined> {
    return this.db.get('SELECT * FROM users WHERE id = ?', id);
  }
}
