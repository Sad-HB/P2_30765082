import { Request, Response } from 'express';
import { ContactsModel } from '../models/ContactsModel';
import { validationResult } from 'express-validator';
import axios from 'axios';
import nodemailer from 'nodemailer';

export class ContactsController {
  static async add(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, comment } = req.body;
      let realIp = req.headers['x-forwarded-for'] as string | undefined;
      if (realIp) {
        realIp = realIp.split(',')[0].trim();
      } else if (req.connection && req.connection.remoteAddress) {
        realIp = req.connection.remoteAddress;
      } else if (req.socket && req.socket.remoteAddress) {
        realIp = req.socket.remoteAddress;
      } else {
        realIp = req.ip;
      }
      const localIps = ['::1', '127.0.0.1', '::ffff:127.0.0.1'];
      const ipStr = realIp || '';
      const privateRanges = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./];
      if (!ipStr || localIps.includes(ipStr) || privateRanges.some(r => r.test(ipStr))) {
        return res.status(400).json({ success: false, message: 'No se permite registrar desde una IP local o privada. Su IP detectada es: ' + ipStr });
      }
      const ip = ipStr;
      const timestamp = new Date().toISOString();
    
      let country = 'unknown';
      try {
        const response = await axios.get(`http://api.ipstack.com/${ip}?access_key=a3a44a9f161c1733abc17610b9cbff83`);
        if (typeof response.data === 'object' && response.data !== null && 'success' in response.data && response.data.success === false) {
          console.error('IPStack API Error:', (response.data as { error?: string }).error);
        } else if (typeof response.data === 'object' && response.data !== null) {
          country = (response.data as { country_name?: string }).country_name || 'unknown';
        }
      } catch (error) {
        console.error('Error fetching geolocation data:', error);
      }

      const recaptchaSecret = process.env.RECAPTCHA_SECRET;
      const recaptchaResponse = req.body['g-recaptcha-response'];
      if (!recaptchaResponse) {
        return res.status(400).json({ success: false, message: 'Por favor, verifica el reCAPTCHA.' });
      }
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaResponse}`;
      const recaptchaVerify = await axios.post(verifyUrl);
      const recaptchaData = recaptchaVerify.data as { success: boolean };
      if (!recaptchaData.success) {
        return res.status(400).json({ success: false, message: 'Falló la verificación de reCAPTCHA.' });
      }

      const dataToSave = { email, name, comment, ip, timestamp, country };

      await ContactsModel.saveContact(dataToSave);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      });
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: [process.env.MAIL_USER, 'programacion2ais@yopmail.com'].join(','),
        subject: 'Nuevo contacto recibido',
        html: `<h3>Nuevo contacto recibido</h3>
          <ul>
            <li><b>Nombre:</b> ${name}</li>
            <li><b>Correo:</b> ${email}</li>
            <li><b>Comentario:</b> ${comment}</li>
            <li><b>IP:</b> ${ip}</li>
            <li><b>País:</b> ${country}</li>
            <li><b>Fecha/Hora:</b> ${timestamp}</li>
          </ul>`
      };
      try {
        await transporter.sendMail(mailOptions);
      } catch (err) {
        console.error('Error enviando correo de notificación:', err);
      }

      res.status(200).json({ success: true, message: 'Contact added successfully' });
    } catch (error) {
      console.error('Error in add:', error);
      res.status(500).json({ success: false, message: 'Error saving contact', error });
    }
  }

  static async index(req: Request, res: Response) {
    try {
      const contacts = await ContactsModel.getAllContacts();
      res.render('index', { contacts });
    } catch (error) {
      res.status(500).send('Error retrieving contacts');
    }
  }
}