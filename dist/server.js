"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const ContactsController_1 = require("./controllers/ContactsController");
const PaymentsController_1 = require("./controllers/PaymentsController");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.post('/contact/add', ContactsController_1.ContactsController.add);
app.get('/admin/contacts', ContactsController_1.ContactsController.index);
app.post('/payment/add', PaymentsController_1.PaymentsController.validatePayment(), PaymentsController_1.PaymentsController.add);
app.get('/', ContactsController_1.ContactsController.index);
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
