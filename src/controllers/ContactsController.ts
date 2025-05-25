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
      // Obtener la IP real del usuario considerando proxies y evitar IPs locales/privadas
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
      // Detectar IP local o privada y rechazar el registro si es así
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
        const response = await axios.get(`http://api.ipstack.com/${ip}?access_key=131395763755075415d53862f3ab8ae7`);
        if (typeof response.data === 'object' && response.data !== null && 'success' in response.data && response.data.success === false) {
          console.error('IPStack API Error:', (response.data as { error?: string }).error);
        } else if (typeof response.data === 'object' && response.data !== null) {
          country = (response.data as { country_name?: string }).country_name || 'unknown';
        }
      } catch (error) {
        console.error('Error fetching geolocation data:', error);
      }

      // Validar Google reCAPTCHA antes de guardar el contacto
      const recaptchaSecret = '6LdKAUQrAAAAAGMSLpffLyiG78i7sfqNI8K34yhr';
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

      // Enviar notificación por correo electrónico
      const transporter = nodemailer.createTransport({
        service: 'gmail', // Puedes cambiar a otro servicio si lo deseas
        auth: {
          user: 'henzo30765082@gmail.com', // Cambia por un correo real si usas Gmail real
          pass: 'ceeu ayfp ukyl ktza' // Cambia por la contraseña real o token de aplicación
        }
      });
      const mailOptions = {
        from: 'henzo30765082@gmail.com',
        to: ['henzo30765082@gmail.com'], // Puedes agregar más destinatarios separados por coma
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