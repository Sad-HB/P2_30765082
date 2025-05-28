import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import axios from 'axios';

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
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZmFrZSBwYXltZW50IiwiZGF0ZSI6IjIwMjUtMDUtMjhUMjM6Mzg6MjYuMTk1WiIsImlhdCI6MTc0ODQ3NTUwNn0.M8D7p1AWICr0YIcaHsyVfDJIUAKjfvHwdEtfAPwkKbU'
            }
          }
        );
        const data = response.data as any;
        if (data && (data.status === 'APROBADO' || data.status === 'aprobado' || data.status === 'success')) {
          // Responder con el formato solicitado
          return res.status(200).json({
            success: true,
            message: 'Pago exitoso',
            data: {
              transaction_id: data.transaction_id,
              amount: data.amount,
              currency: data.currency,
              description: data.description,
              reference: data.reference,
              date: data.date
            }
          });
        } else if (data && data.status === 'RECHAZADO') {
          return res.status(400).json({ success: false, message: 'Pago rechazado por el banco. Verifica los datos de la tarjeta o contacta a tu banco.', code: data.status });
        } else if (data && data.status === 'ERROR') {
          return res.status(400).json({ success: false, message: 'Error en el pago. Intenta nuevamente más tarde o usa otra tarjeta.', code: data.status });
        } else if (data && data.status === 'INSUFICIENTE') {
          return res.status(400).json({ success: false, message: 'Fondos insuficientes en la tarjeta. Usa otra tarjeta o recarga saldo.', code: data.status });
        } else if (data && data.status === 'INVALIDO') {
          return res.status(400).json({ success: false, message: 'Número de tarjeta inválido. Verifica el número ingresado.', code: data.status });
        } else {
          // Si el mensaje es 'Payment successful' en cualquier caso, forzar error claro en español
          if (data && data.message && data.message.trim().toLowerCase() === 'payment successful') {
            return res.status(400).json({ success: false, message: 'Respuesta inconsistente del proveedor de pagos. Contacte soporte.', code: data.status });
          }
          return res.status(400).json({ success: false, message: data && (data.message || data.status) ? (data.message || data.status) : 'Pago rechazado o error desconocido.', code: data.status });
        }
      } catch (err: any) {
        // Si la API devuelve un error de validación, mostrar el mensaje específico y los detalles
        if (err.response && err.response.data && err.response.data.errors) {
          const detalles = err.response.data.errors.map((e: any) => `${e.msg} (campo: ${e.path})`).join('<br>');
          return res.status(400).json({ success: false, message: 'Error de validación en el pago:<br>' + detalles, errors: err.response.data.errors });
        }
        // Si la API fake devuelve un mensaje de error específico
        if (err.response && err.response.data && err.response.data.message) {
          return res.status(400).json({ success: false, message: err.response.data.message });
        }
        return res.status(500).json({ success: false, message: 'Error procesando el pago. Intenta nuevamente más tarde.', error: err && err.response && err.response.data ? err.response.data : err.message });
      }
    } catch (error) {
      res.status(500).send('Error procesando el pago');
    }
  }
}