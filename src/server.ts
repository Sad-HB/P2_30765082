import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { ContactsController } from './controllers/ContactsController';
import { PaymentsController } from './controllers/PaymentsController';
import { AuthController } from './controllers/AuthController';
import { PasswordController } from './controllers/PasswordController';
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
import i18n from 'i18n';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


dotenv.config();


let usersModel: UsersModel;
(async () => {
  const db = await open({ filename: path.join(__dirname, '../database.sqlite'), driver: sqlite3.Database });
  usersModel = await UsersModel.initialize(path.join(__dirname, '../database.sqlite'));
  app.locals.usersModel = usersModel;

  
  passport.use(new LocalStrategy(
    async (usernameOrEmail: string, password: string, done: (error: any, user?: any, options?: any) => void) => {
      try {
        
        let user = await usersModel.findByUsername(usernameOrEmail);
        if (!user) {
          user = await usersModel.findByEmail(usernameOrEmail);
        }
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
    
    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    let user = await usersModel.findByUsername(profile.id);
    if (!user) {
      
      user = await usersModel.createUser(profile.id, accessToken, email);
    } else if (email && !user.email) {
      
      await usersModel.updateEmailByUsername(profile.id, email);
      user.email = email;
    }
    return done(null, user);
  }));

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
})();


app.use(session({
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

app.use(passport.initialize());
app.use(passport.session());

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
    " connect-src 'self' https://www.google-analytics.com;","frame-ancestors 'self' https://www.google.com;",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  ].join(' ');
  res.setHeader("Content-Security-Policy", csp);
  next();
});


i18n.configure({
  locales: ['es', 'en'],
  directory: path.join(__dirname, '../locales'),
  defaultLocale: 'es',
  cookie: 'lang',
  queryParameter: 'lang',
  autoReload: true,
  objectNotation: true
});
app.use(i18n.init);

// Middleware para cambiar idioma por query o cookie
app.use((req, res, next) => {
  let lang = req.cookies?.lang || req.query.lang;
  if (lang && ['es', 'en'].includes(lang)) {
    i18n.setLocale(req, lang);
    i18n.setLocale(res, lang);
    res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  }
  res.locals.__ = i18n.__.bind(res);
  res.locals.locale = i18n.getLocale(req);
  next();
});


function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


app.post('/contact/add', ContactsController.add);
app.get('/admin/contacts', ContactsController.index);


app.post('/payment/add', PaymentsController.validatePayment(), PaymentsController.add);


app.get('/', async (req, res) => {
  let contacts = [];
  let payments = [];
  
  if (req.isAuthenticated && req.isAuthenticated() && req.user && (req.user as any).username === 'admin') {
    contacts = await ContactsModel.getAllContacts();
    payments = await PaymentsModel.getAllPayments();
  }
  
  res.render('index', { contacts, payments, user: req.user, adminError: req.query.adminError });
});


app.get('/login', AuthController.showLogin);
app.post('/login', AuthController.login);
app.get('/logout', AuthController.logout);
app.get('/forgot-password', PasswordController.showForgotForm);
app.post('/forgot-password', PasswordController.sendResetLink);
app.get('/reset-password', PasswordController.showResetForm);
app.post('/reset-password', PasswordController.resetPassword);


app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
   
    const adminEmails = ['admin@gmail.com', 'henzo30765082@gmail.com'];
    if (!req.user || !adminEmails.includes((req.user as any).email)) {
      req.logout(() => {
        res.render('login', { error: 'Solo los administradores pueden iniciar sesión con Google.' });
      });
      return;
    }
    res.redirect('/admin/dashboard');
  }
);


app.get('/contacts', ensureAuthenticated, async (req, res) => {
  const contacts = await ContactsModel.getAllContacts();
  
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


app.get('/admin/dashboard', ensureAuthenticated, async (req, res) => {
  const adminEmails = ['admin@gmail.com', 'henzo30765082@gmail.com'];
  if (!req.user || !adminEmails.includes((req.user as any).email)) {
    return res.status(403).send('Acceso restringido solo a administradores.');
  }
  const contacts = await ContactsModel.getAllContacts();
  const payments = await PaymentsModel.getAllPayments();
  res.render('admin_dashboard', { contacts, payments, user: req.user, request: req });
});

