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
const PasswordController_1 = require("./controllers/PasswordController");
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
const i18n_1 = __importDefault(require("i18n"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
dotenv_1.default.config();
let usersModel;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, sqlite_1.open)({ filename: path_1.default.join(__dirname, '../database.sqlite'), driver: sqlite3_1.default.Database });
    usersModel = yield UsersModel_1.UsersModel.initialize(path_1.default.join(__dirname, '../database.sqlite'));
    app.locals.usersModel = usersModel;
    passport_1.default.use(new passport_local_1.Strategy((usernameOrEmail, password, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let user = yield usersModel.findByUsername(usernameOrEmail);
            if (!user) {
                user = yield usersModel.findByEmail(usernameOrEmail);
            }
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
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: '/auth/google/callback',
    }, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        let user = yield usersModel.findByUsername(profile.id);
        if (!user) {
            user = yield usersModel.createUser(profile.id, accessToken, email);
        }
        else if (email && !user.email) {
            yield usersModel.updateEmailByUsername(profile.id, email);
            user.email = email;
        }
        return done(null, user);
    })));
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}))();
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 15 * 60 * 1000
    }
}));
app.use((req, res, next) => {
    if (req.session) {
        req.session.touch();
    }
    next();
});
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((req, res, next) => {
    res.locals.RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';
    next();
});
app.use((req, res, next) => {
    res.locals.GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || '';
    next();
});
app.use((req, res, next) => {
    const csp = [
        "default-src 'self' https://www.gstatic.com https://www.google.com https://www.googletagmanager.com;",
        "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://www.googletagmanager.com;",
        "frame-src https://www.google.com https://www.gstatic.com;",
        "style-src 'self' 'unsafe-inline' https://www.gstatic.com;",
        "style-src-elem 'self' 'unsafe-inline' https://www.gstatic.com;",
        " connect-src 'self' https://www.google-analytics.com;", "frame-ancestors 'self' https://www.google.com;",
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    ].join(' ');
    res.setHeader("Content-Security-Policy", csp);
    next();
});
i18n_1.default.configure({
    locales: ['es', 'en'],
    directory: path_1.default.join(__dirname, '../locales'),
    defaultLocale: 'es',
    cookie: 'lang',
    queryParameter: 'lang',
    autoReload: true,
    objectNotation: true
});
app.use(i18n_1.default.init);
// Middleware para cambiar idioma por query o cookie
app.use((req, res, next) => {
    var _a;
    let lang = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.lang) || req.query.lang;
    if (lang && ['es', 'en'].includes(lang)) {
        i18n_1.default.setLocale(req, lang);
        i18n_1.default.setLocale(res, lang);
        res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
    }
    res.locals.__ = i18n_1.default.__.bind(res);
    res.locals.locale = i18n_1.default.getLocale(req);
    next();
});
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
app.post('/contact/add', ContactsController_1.ContactsController.add);
app.get('/admin/contacts', ContactsController_1.ContactsController.index);
app.post('/payment/add', PaymentsController_1.PaymentsController.validatePayment(), PaymentsController_1.PaymentsController.add);
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let contacts = [];
    let payments = [];
    if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.username === 'admin') {
        contacts = yield ContactsModel_1.ContactsModel.getAllContacts();
        payments = yield PaymentsModel_1.PaymentsModel.getAllPayments();
    }
    res.render('index', { contacts, payments, user: req.user, adminError: req.query.adminError });
}));
app.get('/login', AuthController_1.AuthController.showLogin);
app.post('/login', AuthController_1.AuthController.login);
app.get('/logout', AuthController_1.AuthController.logout);
app.get('/forgot-password', PasswordController_1.PasswordController.showForgotForm);
app.post('/forgot-password', PasswordController_1.PasswordController.sendResetLink);
app.get('/reset-password', PasswordController_1.PasswordController.showResetForm);
app.post('/reset-password', PasswordController_1.PasswordController.resetPassword);
app.get('/auth/google', passport_1.default.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login' }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const adminEmails = ['admin@gmail.com', 'henzo30765082@gmail.com'];
    if (!req.user || !adminEmails.includes(req.user.email)) {
        req.logout(() => {
            res.render('login', { error: 'Solo los administradores pueden iniciar sesión con Google.' });
        });
        return;
    }
    res.redirect('/admin/dashboard');
}));
app.get('/contacts', ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contacts = yield ContactsModel_1.ContactsModel.getAllContacts();
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
app.get('/admin/dashboard', ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const adminEmails = ['admin@gmail.com', 'henzo30765082@gmail.com'];
    if (!req.user || !adminEmails.includes(req.user.email)) {
        return res.status(403).send('Acceso restringido solo a administradores.');
    }
    const contacts = yield ContactsModel_1.ContactsModel.getAllContacts();
    const payments = yield PaymentsModel_1.PaymentsModel.getAllPayments();
    res.render('admin_dashboard', { contacts, payments, user: req.user, request: req });
}));
