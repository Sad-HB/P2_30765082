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
class PaymentsController {
    static add(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, cardholderName, cardNumber, expirationMonth, expirationYear, cvv, amount, currency } = req.body;
                
                console.log('Payment received:', {
                    email,
                    cardholderName,
                    amount,
                    currency,
                    expirationMonth,
                    expirationYear
                });
                res.status(200).send('Pago realizado');
            }
            catch (error) {
                res.status(500).send('Error procesando el pago');
            }
        });
    }
}
exports.PaymentsController = PaymentsController;
