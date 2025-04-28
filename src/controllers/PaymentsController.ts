import { Request, Response } from 'express';

export class PaymentsController {
  static async add(req: Request, res: Response) {
    try {
      const { email, cardholderName, cardNumber, expirationMonth, expirationYear, cvv, amount, currency } = req.body;

      // For now, just log the payment details (excluding sensitive data like card number and CVV)
      console.log('Payment received:', {
        email,
        cardholderName,
        amount,
        currency,
        expirationMonth,
        expirationYear
      });

      res.status(200).send('Pago realizado');
    } catch (error) {
      res.status(500).send('Error procesando el pago');
    }
  }
}