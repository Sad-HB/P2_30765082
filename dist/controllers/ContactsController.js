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
                const ip = req.ip && req.ip !== '::1' ? req.ip : '?.?.?.?';
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
