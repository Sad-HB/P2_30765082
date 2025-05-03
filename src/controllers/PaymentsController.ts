import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

export class PaymentsController {
  static validatePayment() {
    return [
      body('cardNumber')
        .matches(/^\d+$/)
        .withMessage('El número de tarjeta debe contener solo números y no puede incluir letras.')
        .isLength({ min: 13, max: 19 })
        .withMessage('El número de tarjeta debe tener entre 13 y 19 dígitos.')
    ];
  }

  static async add(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, cardholderName, amount, currency } = req.body;

    
      console.log('Payment received:', { email, cardholderName, amount, currency });

      res.status(200).send('Pago realizado');
    } catch (error) {
      res.status(500).send('Error procesando el pago');
    }
  }
}