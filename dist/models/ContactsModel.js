"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsModel = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
class ContactsModel {
    static getDbConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, sqlite_1.open)({
                filename: './database.sqlite',
                driver: sqlite3_1.default.Database
            });
        });
    }
    static saveContact(contact) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDbConnection();
            yield db.run('CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, email TEXT, name TEXT, comment TEXT, ip TEXT, timestamp TEXT)');
            yield db.run('INSERT INTO contacts (email, name, comment, ip, timestamp) VALUES (?, ?, ?, ?, ?)', contact.email, contact.name, contact.comment, contact.ip, contact.timestamp);
            yield db.close();
        });
    }
    static getAllContacts() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDbConnection();
            const contacts = yield db.all('SELECT * FROM contacts');
            yield db.close();
            return contacts;
        });
    }
}
exports.ContactsModel = ContactsModel;
