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
exports.UsersModel = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UsersModel {
    constructor(db) {
        this.db = db;
    }
    static initialize(dbPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield (0, sqlite_1.open)({
                filename: dbPath,
                driver: sqlite3_1.default.Database,
            });
            yield db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
            return new UsersModel(db);
        });
    }
    createUser(username, password, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const password_hash = yield bcrypt_1.default.hash(password, 10);
            const result = yield this.db.run('INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)', username, password_hash, email || null);
            return { id: result.lastID, username, password_hash, email };
        });
    }
    findByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.get('SELECT * FROM users WHERE username = ?', username);
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.get('SELECT * FROM users WHERE id = ?', id);
        });
    }
    // Permite actualizar el email de un usuario por username
    updateEmailByUsername(username, email) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.run('UPDATE users SET email = ? WHERE username = ?', email, username);
        });
    }
    // Buscar usuario por email
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.get('SELECT * FROM users WHERE email = ?', email);
        });
    }
}
exports.UsersModel = UsersModel;
