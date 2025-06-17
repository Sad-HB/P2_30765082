import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcrypt';

export interface User {
  id?: number;
  username: string;
  password_hash: string;
  email?: string;
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
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
    return new UsersModel(db);
  }

  async createUser(username: string, password: string, email?: string) {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await this.db.run(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
      username,
      password_hash,
      email || null
    );
    return { id: result.lastID, username, password_hash, email };
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.db.get('SELECT * FROM users WHERE username = ?', username);
  }

  async findById(id: number): Promise<User | undefined> {
    return this.db.get('SELECT * FROM users WHERE id = ?', id);
  }

  // Permite actualizar el email de un usuario por username
  async updateEmailByUsername(username: string, email: string) {
    await this.db.run('UPDATE users SET email = ? WHERE username = ?', email, username);
  }

  // Buscar usuario por email
  async findByEmail(email: string) {
    return this.db.get('SELECT * FROM users WHERE email = ?', email);
  }

  // Permite actualizar la contraseña por email
  async updatePasswordByEmail(email: string, newPassword: string) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    await this.db.run('UPDATE users SET password_hash = ? WHERE email = ?', password_hash, email);
  }
}
