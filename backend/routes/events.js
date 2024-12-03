const express = require('express');
const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');
const jwt = require('jsonwebtoken');

const router = express.Router();
const builder = new xml2js.Builder();

// Get all events or a specific event by ID
router.get('/xml', (req, res) => {
    const eventId = req.query.id;
    const xmlFilePath = path.join(__dirname, '../xml', 'events.xml');

    if (eventId) {
        fs.readFile(xmlFilePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error reading XML file' });
            }

            const parser = new xml2js.Parser();
            parser.parseString(data, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error parsing XML data' });
                }

                const events = result.events.event || [];
                const event = events.find(e => e.id && e.id[0] === eventId);

                if (event) {
                    return res.json(event);
                } else {
                    return res.status(404).json({ message: 'Event not found' });
                }
            });
        });
    } else {
        res.set('Content-Type', 'application/xml');
        return res.sendFile(xmlFilePath);
    }
});

// Add new event
router.post('/', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const userEmail = decoded.email;
        const newEvent = {
            id: Math.random() * 100000,
            title: req.body.title,
            date: req.body.date,
            description: req.body.description,
            location: req.body.location,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            uploader: userEmail,
        };

        const xmlFilePath = path.join(__dirname, '../xml', 'events.xml');
        fs.readFile(xmlFilePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error reading XML file' });
            }

            const parser = new xml2js.Parser();
            parser.parseString(data, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error parsing XML data' });
                }

                const events = result.events.event || [];
                events.push({
                    id: newEvent.id.toString(),
                    title: newEvent.title,
                    date: newEvent.date,
                    description: newEvent.description,
                    location: newEvent.location,
                    latitude: newEvent.latitude,
                    longitude: newEvent.longitude,
                    uploader: newEvent.uploader,
                });

                result.events.event = events;
                const updatedXML = builder.buildObject(result);

                fs.writeFile(xmlFilePath, updatedXML, (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error writing to XML file' });
                    }
                    res.status(201).json({ message: 'Event added successfully' });
                });
            });
        });
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
});

// API to search events (returns JSON) (Incomplete)
router.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    const xmlFilePath = path.join(__dirname, '../xml', 'events.xml');


    if (searchTerm !== '') {
        // Read the XML file
        fs.readFile(xmlFilePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error reading XML file' });
            }

            const parser = new xml2js.Parser();
            parser.parseString(data, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error parsing XML data' });
                }

                // Extract the events array
                const events = result.events.event || [];

                // Filter events based on the search term (case-insensitive)
                const filteredEvents = events.filter(event =>
                    event.title && event.title[0].toLowerCase().includes(searchTerm.toLowerCase())
                );

                // Create a new XML structure for the filtered events
                const responseXML = {
                    events: {
                        event: filteredEvents
                    }
                };

                // Convert the filtered events back to XML format
                const filteredXML = builder.buildObject(responseXML);

                // Set the response content type to XML and send the response
                res.set('Content-Type', 'application/xml');
                res.send(filteredXML);
            });
        });
    }

});

router.get('/count', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        fs.readFile(path.join(__dirname, '../xml', 'events.xml'), 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error reading XML file' });
            }

            const parser = new xml2js.Parser();
            parser.parseString(data, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error parsing XML file' });
                }

                const events = result.events.event || [];
                const userEvents = events.filter(
                    (event) => event.uploader && event.uploader[0] === decoded.email
                );

                return res.status(200).json({ count: userEvents.length });
            });
        });
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
});

router.get('/monthly-count', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        fs.readFile(path.join(__dirname, '../xml', 'events.xml'), 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error reading XML file' });
            }

            const parser = new xml2js.Parser();
            parser.parseString(data, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error parsing XML file' });
                }

                const events = result.events.event || [];
                const userEvents = events.filter(
                    (event) => event.uploader && event.uploader[0] === decoded.email
                );

                // Count events by month
                const monthlyCounts = userEvents.reduce((counts, event) => {
                    const eventDate = event.date && event.date[0]; // Assuming event.date exists and is formatted properly
                    if (eventDate) {
                        const month = new Date(eventDate).toLocaleString('default', { month: 'long' });
                        counts[month] = (counts[month] || 0) + 1;
                    }
                    return counts;
                }, {});

                return res.status(200).json({ monthlyCounts });
            });
        });
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
});

// Export router
module.exports = router;
