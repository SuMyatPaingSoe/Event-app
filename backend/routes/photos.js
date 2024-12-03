const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
    const query = req.query.query;
    const url = `https://api.unsplash.com/photos/random?query=${query}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

module.exports = router;
