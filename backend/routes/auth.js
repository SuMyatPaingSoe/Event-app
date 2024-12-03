const express = require('express');
const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const builder = new xml2js.Builder();
const router = express.Router();

// User Register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Enter all required fields.' });
    }

    // Sanitize name and email for invalid XML characters
    const sanitizedName = name.replace(/[^a-zA-Z0-9 ]/g, '');
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '');

    if (sanitizedName !== name || sanitizedEmail !== email) {
        return res.status(400).json({ message: 'Invalid characters in name or email.' });
    }

    const filePath = path.join(__dirname, '../xml', 'users.xml');

    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading XML file' });
        }

        const parser = new xml2js.Parser();
        parser.parseString(data, async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error parsing XML file' });
            }

            // Ensure users is always an array
            const users = result.users && result.users.user ? result.users.user : [];

            // Check if user with the same email or name exists
            const emailExists = users.some(u => u.email && u.email[0] === sanitizedEmail);
            const nameExists = users.some(u => u.name && u.name[0] === sanitizedName);

            if (emailExists) {
                return res.status(400).json({ message: 'User with the email already exists.' });
            }

            if (nameExists) {
                return res.status(400).json({ message: 'Name already exists.' });
            }

            // Hash password and create new user
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                name: [sanitizedName],
                email: [sanitizedEmail],
                password: [hashedPassword]
            };

            users.push(newUser);

            // Ensure result.users object structure is correct
            result.users = { user: users };

            // Convert back to XML and save
            const updatedXML = builder.buildObject(result);

            fs.writeFile(filePath, updatedXML, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error writing XML file' });
                }
                res.status(201).json({ message: 'User registered successfully.' });
            });
        });
    });
});

// User Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    fs.readFile(path.join(__dirname, '../xml', 'users.xml'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading XML file' });
        }

        const parser = new xml2js.Parser();
        parser.parseString(data, async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error parsing XML file' });
            }

            const users = result.users.user || [];
            const user = users.find(u => u.email && u.email[0] === email);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Validate password
            const isPasswordValid = await bcrypt.compare(password, user.password[0]);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY);
            res.status(200).json({ message: 'Login successful', token });
        });
    });
});

// Protected Route
router.get('/profile', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        fs.readFile(path.join(__dirname, '../xml', 'users.xml'), 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error reading XML file' });
            }

            const parser = new xml2js.Parser();
            parser.parseString(data, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error parsing XML file' });
                }

                const users = result.users.user || [];
                const user = users.find((u) => u.email && u.email[0] === decoded.email);

                if (user) {
                    res.status(200).json({ email: decoded.email });
                } else {
                    res.status(404).json({ message: 'User not found' });
                }
            });
        });
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
});

module.exports = router;