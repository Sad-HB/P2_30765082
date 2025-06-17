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
      'CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, name TEXT, email TEXT, amount REAL, created_at TEXT, servicio TEXT, estado_pago TEXT)'
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

  static async savePayment(payment: { name: string; email: string; amount: number; created_at: string; servicio: string; estado_pago: string }) {
    await this.ensureTableExists();
    const db = await this.getDbConnection();
    await db.run(
      'INSERT INTO payments (name, email, amount, created_at, servicio, estado_pago) VALUES (?, ?, ?, ?, ?, ?)',
      payment.name, payment.email, payment.amount, payment.created_at, payment.servicio, payment.estado_pago
    );
    await db.close();
  }
}
