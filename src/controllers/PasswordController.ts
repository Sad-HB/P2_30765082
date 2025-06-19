import { Request, Response } from 'express';
import { UsersModel } from '../models/UsersModel';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();


const resetTokens: { [email: string]: { token: string, expires: number } } = {};

export class PasswordController {
  static async showForgotForm(req: Request, res: Response) {
    res.render('forgot_password', { error: null, success: null });
  }

  static async sendResetLink(req: Request, res: Response) {
    const { email } = req.body;
    const user = await req.app.locals.usersModel.findByEmail(email);
    if (!user) {
      return res.render('forgot_password', { error: 'Correo no registrado', success: null });
    }
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens[email] = { token, expires: Date.now() + 1000 * 60 * 15 };
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Recuperación de contraseña',
      html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${resetUrl}">${resetUrl}</a>`
    });
    res.render('forgot_password', { error: null, success: 'Enlace de recuperación enviado a tu correo.' });
  }

  static async showResetForm(req: Request, res: Response) {
    const { token, email } = req.query;
    if (!token || !email || !resetTokens[email as string] || resetTokens[email as string].token !== token) {
      return res.render('reset_password', { error: 'Enlace inválido o expirado', success: null, email });
    }
    res.render('reset_password', { error: null, success: null, email });
  }

  static async resetPassword(req: Request, res: Response) {
    const { email, token, password } = req.body;
    if (!token || !email || !resetTokens[email] || resetTokens[email].token !== token || resetTokens[email].expires < Date.now()) {
      return res.render('reset_password', { error: 'Enlace inválido o expirado', success: null, email });
    }
    await req.app.locals.usersModel.updatePasswordByEmail(email, password);
    delete resetTokens[email];
    res.render('reset_password', { error: null, success: 'Contraseña restablecida correctamente', email });
  }
}
