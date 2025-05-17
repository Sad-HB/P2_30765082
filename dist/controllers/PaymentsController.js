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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const express_validator_1 = require("express-validator");
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
                const { email, cardholderName, amount, currency } = req.body;
                console.log('Payment received:', { email, cardholderName, amount, currency });
                res.status(200).send('Pago realizado');
            }
            catch (error) {
                res.status(500).send('Error procesando el pago');
            }
        });
    }
}
exports.PaymentsController = PaymentsController;
