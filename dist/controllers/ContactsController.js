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
exports.ContactsController = void 0;
const ContactsModel_1 = require("../models/ContactsModel");
const express_validator_1 = require("express-validator");
const axios_1 = __importDefault(require("axios"));
class ContactsController {
    static add(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const { email, name, comment } = req.body;
                // Obtener la IP real del usuario considerando proxies y evitar IPs locales/privadas
                let realIp = req.headers['x-forwarded-for'];
                if (realIp) {
                    realIp = realIp.split(',')[0].trim();
                } else if (req.connection && req.connection.remoteAddress) {
                    realIp = req.connection.remoteAddress;
                } else if (req.socket && req.socket.remoteAddress) {
                    realIp = req.socket.remoteAddress;
                } else {
                    realIp = req.ip;
                }
                // Detectar IP local o privada y rechazar el registro si es así
                const localIps = ['::1', '127.0.0.1', '::ffff:127.0.0.1'];
                const ipStr = realIp || '';
                const privateRanges = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./];
                if (!ipStr || localIps.includes(ipStr) || privateRanges.some(r => r.test(ipStr))) {
                    return res.status(400).json({ success: false, message: 'No se permite registrar desde una IP local o privada. Su IP detectada es: ' + ipStr });
                }
                const ip = ipStr;
                const timestamp = new Date().toISOString();
                let country = 'unknown';
                try {
                    const response = yield axios_1.default.get(`http://api.ipstack.com/${ip}?access_key=131395763755075415d53862f3ab8ae7`);
                    if (typeof response.data === 'object' && response.data !== null && 'success' in response.data && response.data.success === false) {
                        console.error('IPStack API Error:', response.data.error);
                    }
                    else if (typeof response.data === 'object' && response.data !== null) {
                        country = response.data.country_name || 'unknown';
                    }
                }
                catch (error) {
                    console.error('Error fetching geolocation data:', error);
                }
                const dataToSave = { email, name, comment, ip, timestamp, country };
                yield ContactsModel_1.ContactsModel.saveContact(dataToSave);
                res.status(200).json({ success: true, message: 'Contact added successfully' });
            }
            catch (error) {
                console.error('Error in add:', error);
                res.status(500).json({ success: false, message: 'Error saving contact', error });
            }
        });
    }
    static index(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const contacts = yield ContactsModel_1.ContactsModel.getAllContacts();
                res.render('index', { contacts });
            }
            catch (error) {
                res.status(500).send('Error retrieving contacts');
            }
        });
    }
}
exports.ContactsController = ContactsController;
