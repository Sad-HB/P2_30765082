import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export class ContactsModel {
  private static async getDbConnection() {
    return open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
  }

  static async saveContact(contact: { email: string; name: string; comment: string; ip: string; timestamp: string; country: string }) {
    const db = await this.getDbConnection();
    await db.run(
      'CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, email TEXT, name TEXT, comment TEXT, ip TEXT, timestamp TEXT, country TEXT)'
    );
    await db.run(
      'INSERT INTO contacts (email, name, comment, ip, timestamp, country) VALUES (?, ?, ?, ?, ?, ?)',
      contact.email, contact.name, contact.comment, contact.ip, contact.timestamp, contact.country
    );
    await db.close();
  }

  static async getAllContacts() {
    const db = await this.getDbConnection();
    const contacts = await db.all('SELECT * FROM contacts');
    await db.close();
    return contacts;
  }

  static async listTables() {
    const db = await this.getDbConnection();
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    await db.close();
    return tables;
  }
}