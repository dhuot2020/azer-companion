const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'OmbreLoup Companion',
    playerName: 'OmbreLoup',
    progress: 0
  });
});

module.exports = router;