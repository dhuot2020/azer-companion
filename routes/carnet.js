const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('carnet', {
        page_title: "Carnet d'aventure"
    });
});

module.exports = router;
