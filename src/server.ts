import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { ContactsController } from './controllers/ContactsController';
import { PaymentsController } from './controllers/PaymentsController';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/contact/add', ContactsController.add);
app.get('/admin/contacts', ContactsController.index);

app.post('/payment/add', PaymentsController.validatePayment(), PaymentsController.add);

app.get('/', (req, res) => {
  res.render('index', {
    nombreCompleto: 'Henzo Breto Jesús Colmenares',
    cedula: 'C.I. 30765082',
    seccion: 'Sección 4'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
