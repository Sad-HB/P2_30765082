"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));

const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Configuración del motor de plantillas EJS

app.set('view engine', 'ejs');
app.set('views', './views');

// Configuración para servir archivos estáticos

// Ruta principal
app.get('/', (req, res) => {
    res.render('index', {
        nombreCompleto: 'Henzo Breto Jesús Colmenares',
        cedula: 'C.I. 30765082',
        seccion: 'Sección 4'
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
