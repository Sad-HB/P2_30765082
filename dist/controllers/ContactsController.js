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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsController = void 0;
const ContactsModel_1 = require("../models/ContactsModel");
class ContactsController {
    static add(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, name, comment } = req.body;
                const ip = req.ip || 'unknown';
                const timestamp = new Date().toISOString();
                yield ContactsModel_1.ContactsModel.saveContact({ email, name, comment, ip, timestamp });
                res.status(200).send('Contact added successfully');
            }
            catch (error) {
                res.status(500).send('Error saving contact');
            }
        });
    }
    static index(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const contacts = yield ContactsModel_1.ContactsModel.getAllContacts();
                res.render('contacts', { contacts });
            }
            catch (error) {
                res.status(500).send('Error retrieving contacts');
            }
        });
    }
}
exports.ContactsController = ContactsController;
