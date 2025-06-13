import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { ContactsController } from './controllers/ContactsController';
import { PaymentsController } from './controllers/PaymentsController';
import { AuthController } from './controllers/AuthController';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { UsersModel } from './models/UsersModel';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import { ContactsModel } from './models/ContactsModel';
import { PaymentsModel } from './models/PaymentsModel';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cargar variables de entorno
dotenv.config();

// Inicializar base de datos y modelo de usuarios
let usersModel: UsersModel;
(async () => {
  const db = await open({ filename: path.join(__dirname, '../database.sqlite'), driver: sqlite3.Database });
  usersModel = await UsersModel.initialize(path.join(__dirname, '../database.sqlite'));
  app.locals.usersModel = usersModel;

  // Estrategia local
  passport.use(new LocalStrategy(
    async (username: string, password: string, done: (error: any, user?: any, options?: any) => void) => {
      try {
        const user = await usersModel.findByUsername(username);
        if (!user) return done(null, false, { message: 'Usuario no encontrado' });
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return done(null, false, { message: 'Contraseña incorrecta' });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id: number, done: (err: any, user?: any) => void) => {
    try {
      const user = await usersModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Estrategia Google OAuth2
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: '/auth/google/callback',
  }, async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) => {
    let user = await usersModel.findByUsername(profile.id);
    if (!user) {
      user = await usersModel.createUser(profile.id, accessToken); // Guardar el id de Google como username
    }
    return done(null, user);
  }));

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
})();

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

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
    " connect-src 'self' https://www.google-analytics.com;","frame-ancestors 'self' https://www.google.com;"
  ].join(' ');
  res.setHeader("Content-Security-Policy", csp);
  next();
});

// Middleware para proteger rutas
function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Rutas de contactos
app.post('/contact/add', ContactsController.add);
app.get('/admin/contacts', ContactsController.index);

// Rutas de pagos
app.post('/payment/add', PaymentsController.validatePayment(), PaymentsController.add);

// Ruta principal
app.get('/', async (req, res) => {
  let contacts = [];
  let payments = [];
  // Si el usuario está autenticado y es admin, mostrar datos
  if (req.isAuthenticated && req.isAuthenticated() && req.user && (req.user as any).username === 'admin') {
    contacts = await ContactsModel.getAllContacts();
    payments = await PaymentsModel.getAllPayments();
  }
  res.render('index', { contacts, payments, user: req.user });
});

// Rutas de autenticación
app.get('/login', AuthController.showLogin);
app.post('/login', AuthController.login);
app.get('/logout', AuthController.logout);
app.get('/register', AuthController.showRegister);
app.post('/register', AuthController.register);

// Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Rutas protegidas para contactos y pagos
app.get('/contacts', ensureAuthenticated, async (req, res) => {
  const contacts = await ContactsModel.getAllContacts();
  // Adaptar los datos para la vista
  const contactsView = contacts.map((c: any) => ({
    name: c.name,
    email: c.email,
    message: c.comment,
    created_at: c.timestamp
  }));
  res.render('contacts', { contacts: contactsView });
});

app.get('/payments', ensureAuthenticated, async (req, res) => {
  const payments = await PaymentsModel.getAllPayments();
  res.render('payments', { payments });
});

// Dashboard solo para administradores
app.get('/admin/dashboard', ensureAuthenticated, async (req, res) => {
  if (!req.user || !['admin', 'SadHBc'].includes((req.user as any).username)) {
    return res.status(403).send('Acceso restringido solo a administradores.');
  }
  const contacts = await ContactsModel.getAllContacts();
  const payments = await PaymentsModel.getAllPayments();
  res.render('admin_dashboard', { contacts, payments, user: req.user });
});

