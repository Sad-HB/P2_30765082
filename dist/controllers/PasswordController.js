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
exports.PasswordController = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const resetTokens = {};
class PasswordController {
    static showForgotForm(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.render('forgot_password', { error: null, success: null });
        });
    }
    static sendResetLink(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            const user = yield req.app.locals.usersModel.findByEmail(email);
            if (!user) {
                return res.render('forgot_password', { error: 'Correo no registrado', success: null });
            }
            const token = crypto_1.default.randomBytes(32).toString('hex');
            resetTokens[email] = { token, expires: Date.now() + 1000 * 60 * 15 };
            const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
            const transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS
                }
            });
            yield transporter.sendMail({
                from: process.env.MAIL_USER,
                to: email,
                subject: 'Recuperación de contraseña',
                html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${resetUrl}">${resetUrl}</a>`
            });
            res.render('forgot_password', { error: null, success: 'Enlace de recuperación enviado a tu correo.' });
        });
    }
    static showResetForm(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token, email } = req.query;
            if (!token || !email || !resetTokens[email] || resetTokens[email].token !== token) {
                return res.render('reset_password', { error: 'Enlace inválido o expirado', success: null, email });
            }
            res.render('reset_password', { error: null, success: null, email });
        });
    }
    static resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, token, password } = req.body;
            if (!token || !email || !resetTokens[email] || resetTokens[email].token !== token || resetTokens[email].expires < Date.now()) {
                return res.render('reset_password', { error: 'Enlace inválido o expirado', success: null, email });
            }
            yield req.app.locals.usersModel.updatePasswordByEmail(email, password);
            delete resetTokens[email];
            res.render('reset_password', { error: null, success: 'Contraseña restablecida correctamente', email });
        });
    }
}
exports.PasswordController = PasswordController;
