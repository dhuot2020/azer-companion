const express = require('express');
const path = require('path');

const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3030;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', dashboardRouter);

app.listen(PORT, () => {
  console.log(`OmbreLoup Companion démarre sur http://localhost:${PORT}`);
});