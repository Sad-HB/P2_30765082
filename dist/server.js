
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', './views');
// Ruta principal
app.get('/', (req, res) => {
    res.render('index',"css", {
        nombreCompleto: 'Henzo Breto Jesús Colmenares',
        cedula: 'C.I. 30765082',
        seccion: 'Sección 4'
    });
});
// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
