const express = require('express');
const path = require('path');

const carnetRouter = require('./routes/carnet');

const app = express();
const PORT = process.env.PORT || 3030;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', carnetRouter);

app.listen(PORT, () => {
  console.log(`
=========================================
             AZER COMPANION
              par DH Studio
=========================================

Serveur démarré :
http://localhost:${PORT}

Que l'aventure continue.
  `);
});