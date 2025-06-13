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
exports.PaymentsController = void 0;
const express_validator_1 = require("express-validator");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const PaymentsModel_1 = require("../models/PaymentsModel");
dotenv_1.default.config();
class PaymentsController {
    static validatePayment() {
        return [
            (0, express_validator_1.body)('cardNumber')
                .matches(/^\d+$/)
                .withMessage('El número de tarjeta debe contener solo números y no puede incluir letras.')
                .isLength({ min: 13, max: 19 })
                .withMessage('El número de tarjeta debe tener entre 13 y 19 dígitos.')
        ];
    }
    static add(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const { email, cardholderName, cardNumber, expiryMonth, expiryYear, cvv, amount, currency } = req.body;
                console.log('REQ.BODY:', req.body);
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
                    const response = yield axios_1.default.post('https://fakepayment.onrender.com/payments', paymentPayload, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.FAKEPAYMENT_API_KEY}`
                        }
                    });
                    const data = response.data;
                    if ((data && (data.status === 'APROBADO' || data.status === 'aprobado' || data.status === 'success')) ||
                        (data && data.success === true) ||
                        (data && data.message && (data.message.trim().toLowerCase() === 'pago exitoso' ||
                            data.message.trim().toLowerCase() === 'payment successful'))) {
                        // Guardar el pago exitoso en la base de datos
                        const paymentToSave = {
                            name: cardholderName,
                            email: email,
                            amount: parseFloat(amount),
                            created_at: (data.date || new Date().toISOString())
                        };
                        yield PaymentsModel_1.PaymentsModel.savePayment(paymentToSave);
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
                    }
                    else if (data && data.status === 'RECHAZADO') {
                        return res.status(400).json({ success: false, message: 'Pago rechazado por el banco. Verifica los datos de la tarjeta o contacta a tu banco.', code: data.status });
                    }
                    else if (data && data.status === 'ERROR') {
                        return res.status(400).json({ success: false, message: 'Error en el pago. Intenta nuevamente más tarde o usa otra tarjeta.', code: data.status });
                    }
                    else if (data && data.status === 'INSUFICIENTE') {
                        return res.status(400).json({ success: false, message: 'Fondos insuficientes en la tarjeta. Usa otra tarjeta o recarga saldo.', code: data.status });
                    }
                    else if (data && data.status === 'INVALIDO') {
                        return res.status(400).json({ success: false, message: 'Número de tarjeta inválido. Verifica el número ingresado.', code: data.status });
                    }
                    else {
                        if (data && data.message && data.message.trim().toLowerCase() === 'payment successful') {
                            return res.status(400).json({ success: false, message: 'Respuesta inconsistente del proveedor de pagos. Contacte soporte.', code: data.status });
                        }
                        return res.status(400).json({ success: false, message: data && (data.message || data.status) ? (data.message || data.status) : 'Pago rechazado o error desconocido.', code: data.status });
                    }
                }
                catch (err) {
                    if (err.response && err.response.data && err.response.data.errors) {
                        const detalles = err.response.data.errors.map((e) => `${e.msg} (campo: ${e.path})`).join('<br>');
                        return res.status(400).json({ success: false, message: 'Error de validación en el pago:<br>' + detalles, errors: err.response.data.errors });
                    }
                    if (err.response && err.response.data && err.response.data.message) {
                        return res.status(400).json({ success: false, message: err.response.data.message });
                    }
                    return res.status(500).json({ success: false, message: 'Error procesando el pago. Intenta nuevamente más tarde.', error: err && err.response && err.response.data ? err.response.data : err.message });
                }
            }
            catch (error) {
                res.status(500).send('Error procesando el pago');
            }
        });
    }
}
exports.PaymentsController = PaymentsController;
