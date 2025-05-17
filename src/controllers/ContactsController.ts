import { Request, Response } from 'express';
import { ContactsModel } from '../models/ContactsModel';
import { validationResult } from 'express-validator';
import axios from 'axios';

export class ContactsController {
  static async add(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, comment } = req.body;
      const ip = req.ip && req.ip !== '::1' ? req.ip : '8.8.8.8'; 
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

      const dataToSave = { email, name, comment, ip, timestamp, country };

      await ContactsModel.saveContact(dataToSave);

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