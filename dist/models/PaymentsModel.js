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
exports.PaymentsModel = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
class PaymentsModel {
    static getDbConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, sqlite_1.open)({
                filename: './database.sqlite',
                driver: sqlite3_1.default.Database
            });
        });
    }
    static ensureTableExists() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDbConnection();
            yield db.run('CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, name TEXT, email TEXT, amount REAL, created_at TEXT)');
            yield db.close();
        });
    }
    static getAllPayments() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureTableExists();
            const db = yield this.getDbConnection();
            const payments = yield db.all('SELECT * FROM payments');
            yield db.close();
            return payments;
        });
    }
}
exports.PaymentsModel = PaymentsModel;
