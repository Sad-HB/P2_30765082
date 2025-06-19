import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UsersModel } from '../models/UsersModel';

export class AuthController {
  static async showLogin(req: Request, res: Response) {
    res.render('login', { error: null });
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.render('login', { error: info.message });
      req.logIn(user, (err: any) => {
        if (err) return next(err);
        
        const adminEmails = ['admin@gmail.com', 'henzo30765082@gmail.com'];
        if (user.email && adminEmails.includes(user.email)) {
          return res.redirect('/admin/dashboard');
        }
        
        req.logout(() => {
          res.redirect('/?adminError=1');
        });
      });
    })(req, res, next);
  }

  static logout(req: Request, res: Response) {
    req.logout(() => {
      res.redirect('/login');
    });
  }

  static async showRegister(req: Request, res: Response) {
    res.render('register', { error: null });
  }

  static async register(req: Request, res: Response) {
    const { username, password } = req.body;
    try {
      const user = await req.app.locals.usersModel.createUser(username, password);
      res.redirect('/login');
    } catch (err: any) {
      res.render('register', { error: 'Error al registrar usuario: ' + (err.message || err) });
    }
  }
}
