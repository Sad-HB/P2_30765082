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
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const ContactsController_1 = require("./controllers/ContactsController");
const PaymentsController_1 = require("./controllers/PaymentsController");
const AuthController_1 = require("./controllers/AuthController");
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
const UsersModel_1 = require("./models/UsersModel");
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const bcrypt_1 = __importDefault(require("bcrypt"));
const ContactsModel_1 = require("./models/ContactsModel");
const PaymentsModel_1 = require("./models/PaymentsModel");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Cargar variables de entorno
dotenv_1.default.config();
// Inicializar base de datos y modelo de usuarios
let usersModel;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.open)({ filename: path_1.default.join(__dirname, '../database.sqlite'), driver: sqlite3_1.default.Database });
    usersModel = yield UsersModel_1.UsersModel.initialize(path_1.default.join(__dirname, '../database.sqlite'));
    app.locals.usersModel = usersModel;
    // Estrategia local
    passport_1.default.use(new passport_local_1.Strategy((username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield usersModel.findByUsername(username);
            if (!user)
                return done(null, false, { message: 'Usuario no encontrado' });
            const match = yield bcrypt_1.default.compare(password, user.password_hash);
            if (!match)
                return done(null, false, { message: 'Contraseña incorrecta' });
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    })));
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield usersModel.findById(id);
            done(null, user);
        }
        catch (err) {
            done(err);
        }
    }));
    // Estrategia Google OAuth2
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: '/auth/google/callback',
    }, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        let user = yield usersModel.findByUsername(profile.id);
        if (!user) {
            user = yield usersModel.createUser(profile.id, accessToken); // Guardar el id de Google como username
        }
        return done(null, user);
    })));
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}))();
// Configuración de sesión
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
}));
// Inicializar Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Middleware para exponer la variable de entorno RECAPTCHA_SITE_KEY a todas las vistas EJS
app.use((req, res, next) => {
    res.locals.RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';
    next();
});
// Middleware para exponer la variable de entorno GA_MEASUREMENT_ID a todas las vistas EJS
app.use((req, res, next) => {
    res.locals.GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || '';
    next();
});
// Content Security Policy y otros middlewares
app.use((req, res, next) => {
    const csp = [
        "default-src 'self' https://www.gstatic.com https://www.google.com https://www.googletagmanager.com;",
        "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://www.googletagmanager.com;",
        "frame-src https://www.google.com https://www.gstatic.com;",
        "style-src 'self' 'unsafe-inline' https://www.gstatic.com;",
        "style-src-elem 'self' 'unsafe-inline' https://www.gstatic.com;",
        " connect-src 'self' https://www.google-analytics.com;", "frame-ancestors 'self' https://www.google.com;"
    ].join(' ');
    res.setHeader("Content-Security-Policy", csp);
    next();
});
// Middleware para proteger rutas
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
// Rutas de contactos
app.post('/contact/add', ContactsController_1.ContactsController.add);
app.get('/admin/contacts', ContactsController_1.ContactsController.index);
// Rutas de pagos
app.post('/payment/add', PaymentsController_1.PaymentsController.validatePayment(), PaymentsController_1.PaymentsController.add);
// Ruta principal
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let contacts = [];
    let payments = [];
    // Si el usuario está autenticado y es admin, mostrar datos
    if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.username === 'admin') {
        contacts = yield ContactsModel_1.ContactsModel.getAllContacts();
        payments = yield PaymentsModel_1.PaymentsModel.getAllPayments();
    }
    res.render('index', { contacts, payments, user: req.user });
}));
// Rutas de autenticación
app.get('/login', AuthController_1.AuthController.showLogin);
app.post('/login', AuthController_1.AuthController.login);
app.get('/logout', AuthController_1.AuthController.logout);
app.get('/register', AuthController_1.AuthController.showRegister);
app.post('/register', AuthController_1.AuthController.register);
// Google OAuth
app.get('/auth/google', passport_1.default.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});
// Rutas protegidas para contactos y pagos
app.get('/contacts', ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contacts = yield ContactsModel_1.ContactsModel.getAllContacts();
    // Adaptar los datos para la vista
    const contactsView = contacts.map((c) => ({
        name: c.name,
        email: c.email,
        message: c.comment,
        created_at: c.timestamp
    }));
    res.render('contacts', { contacts: contactsView });
}));
app.get('/payments', ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payments = yield PaymentsModel_1.PaymentsModel.getAllPayments();
    res.render('payments', { payments });
}));
// Dashboard solo para administradores
app.get('/admin/dashboard', ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !['admin', 'SadHBc'].includes(req.user.username)) {
        return res.status(403).send('Acceso restringido solo a administradores.');
    }
    const contacts = yield ContactsModel_1.ContactsModel.getAllContacts();
    const payments = yield PaymentsModel_1.PaymentsModel.getAllPayments();
    res.render('admin_dashboard', { contacts, payments, user: req.user });
}));
