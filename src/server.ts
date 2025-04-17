import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 



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
