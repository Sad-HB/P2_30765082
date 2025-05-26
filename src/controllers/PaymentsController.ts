import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import axios from 'axios';

export class PaymentsController {
  static validatePayment() {
    return [
      body('cardNumber')
        .matches(/^[0-9]+$/)
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

      // Tomar todos los datos del formulario
      const { email, cardholderName, cardNumber, expiryMonth, expiryYear, cvv, amount, currency } = req.body;

      // Llamar a la Fake Payment API (https://fakepayment.onrender.com/payments)
      const paymentPayload = {
        amount,
        "card-number": cardNumber,
        cvv,
        "expiration-month": expiryMonth,
        "expiration-year": expiryYear,
        "full-name": cardholderName,
        currency,
        description: `Pago de ${email}`,
        reference: email
      };
      try {
        const response = await axios.post(
          'https://fakepayment.onrender.com/payments',
          paymentPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer 131395763755075415d53862f3ab8ae7'
            }
          }
        );
        const data = response.data as any;
        if (data && data.status === 'APROBADO') {
          return res.status(200).json({ success: true, message: 'Pago realizado correctamente', paymentId: data.transaction_id });
        } else {
          return res.status(400).json({ success: false, message: data && data.message ? data.message : 'Pago rechazado o error', code: data.status });
        }
      } catch (err: any) {
        return res.status(500).json({ success: false, message: 'Error procesando el pago', error: err && err.response && err.response.data ? err.response.data : err.message });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error procesando el pago', error });
    }
  }
}