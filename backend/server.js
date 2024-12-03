const express = require('express');

require('dotenv').config();

const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors());

// Middleware to parse JSON body 
app.use(express.json());

const eventsRouter = require('./routes/events');
const authRouter = require('./routes/auth');
const photosRouter = require('./routes/photos');

// Use routers
app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);
app.use('/api/photos', photosRouter);


app.get('/api/aboutus', (req, res) => {
    res.set('Content-Type', 'application/xml');
    return res.sendFile(path.join(__dirname, 'xml', 'aboutus.xml'));
});


// Listen on port   
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
