import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export class PaymentsModel {
  private static async getDbConnection() {
    return open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
  }

  static async ensureTableExists() {
    const db = await this.getDbConnection();
    await db.run(
      'CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, name TEXT, email TEXT, amount REAL, created_at TEXT)'
    );
    await db.close();
  }

  static async getAllPayments() {
    await this.ensureTableExists();
    const db = await this.getDbConnection();
    const payments = await db.all('SELECT * FROM payments');
    await db.close();
    return payments;
  }
}
