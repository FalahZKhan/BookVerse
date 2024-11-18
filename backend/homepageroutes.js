const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('./db');
const router = express.Router();

/*
// Signup route
router.post('/signup', async (req, res) => {
    const { username, email, password, role } = req.body;
    console.log('Signup data received:', { username, email, password, role }); // Log signup data

    try {
        const connection = await connectToDatabase();

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword); // Log hashed password

        // Insert user into the Users table
        const result = await connection.execute(
            `INSERT INTO Users (username, email, password, role) VALUES (:username, :email, :password, :role)`,
            { username, email, password: hashedPassword, role }
        );
        console.log('User insert result:', result); // Log result of insert query

        await connection.commit();
        res.status(201).send('User registered successfully');
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Error registering user');
    }
});
*/
router.post('/signup', async (req, res) => {
    const { username, password, email, role } = req.body; // Add `email` here

    try {
        const connection = await connectToDatabase();

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword); // Log hashed password

        // Insert user into the Users table
        const result = await connection.execute(
            `INSERT INTO Users (username, email, password, role) VALUES (:username, :email, :password, :role)`,
            { username, email, password: hashedPassword, role }
        );
        console.log('User insert result:', result); // Log result of insert query
        await connection.commit();

        // Retrieve the newly created user_id
        const results = await connection.execute(
            `SELECT user_id, ROLE FROM USERS WHERE username = :username`,
            [username]
        );

        if (results.rows.length === 0) {
            return res.status(400).json({ error: 'User creation failed' });
        }

        const user = results.rows[0];
        const user_id = user.user_id;
        const user_role = user.ROLE;

        // Create a JWT token with user_id and role
        const token = jwt.sign({ id: user_id, role: user_role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Signup successful', token, role: user_role });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'An error occurred during signup' });
    }
});

/*
// Login route
router.post('/login', async (req, res) => {
  console.log('Login route hit'); // Log route hit

    const { username, password } = req.body;
    console.log('Login data received:', { username, password }); // Log login data
    let connectio

    try {
        connection = await connectToDatabase();

        // Execute SQL query to find the user by username
        const result = await connection.execute(
            `SELECT * FROM USERS WHERE USERNAME = :username`,
            [username]
        );
        console.log('User lookup result:', result); // Log user lookup result

        // Check if user exists
        if (result.rows.length === 0) {
            console.log('User not found');
            return res.status(400).json({ error: 'User not found' });
        }

        // Assuming your user data is in the first row
        const user = result.rows[0];
        console.log('User data fetched from database:', user); // Log user data

        // Access the hashed password correctly
        const hashedPassword = user[3]; // Get the hashed password
        console.log('Hashed password from DB:', hashedPassword); // Log hashed password from DB

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        console.log('Password valid:', isPasswordValid); // Log password validation result

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Create JWT token using user_id
        const token = jwt.sign({ id: user.user_id, role: user.ROLE }, 'your_jwt_secret', { expiresIn: '1h' });
        console.log('Generated JWT token:', token); // Log generated JWT token

        // Send success response
        res.status(200).json({ message: 'Login successful', token, role: user.ROLE });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'An error occurred. Please try again.' });
    } 
});
*/

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const connection = await connectToDatabase();

        // Retrieve user based on username
        const result = await connection.execute(
            `SELECT * FROM USERS WHERE USERNAME = :username`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        console.log('User object from DB:', user); // Log the entire user object

        // The password field is the 4th element (index 3) in the `user` array
        const storedHashedPassword = user[3]; // Accessing the 4th element (password hash)

        // Check if the password exists
        if (!storedHashedPassword) {
            return res.status(400).json({ error: 'Password not found in database' });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Create a JWT token for the user
        const token = jwt.sign({ id: user[0], role: user[4] }, 'your_jwt_secret', { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token, role: user[4] });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});
  
router.get('/search-books', async (req, res) => {
    const { title = '', author = '', genre = '', minRating } = req.query;

    console.log('Search criteria:', { title, author, genre, minRating });

    const parsedMinRating = parseFloat(minRating);
    if (!title && !author && !genre && (isNaN(parsedMinRating) || parsedMinRating < 0)) {
        return res.status(400).send('Please provide at least one search criteria');
    }

    let connection;
    try {
        connection = await connectToDatabase();

        let query = `
            SELECT b.book_title, b.genre, a.author_name, b.ratings, b.book_image_url
            FROM books b 
            JOIN authors a ON b.author_id = a.author_id 
            WHERE 1=1`;

        const queryParams = {};

        if (title.trim()) {
            query += ` AND LOWER(b.book_title) LIKE LOWER(:title)`;
            queryParams.title = `%${title}%`;
        }
        if (author.trim()) {
            query += ` AND LOWER(a.author_name) LIKE LOWER(:author)`;
            queryParams.author = `%${author}%`;
        }
        if (genre.trim()) {
            query += ` AND LOWER(b.genre) LIKE LOWER(:genre)`;
            queryParams.genre = `%${genre}%`;
        }
        if (!isNaN(parsedMinRating) && parsedMinRating >= 0) {
            query += ` AND b.ratings = :minRating`;
            queryParams.minRating = parsedMinRating;
        }

        console.log('Search query:', query);
        console.log('Query parameters:', queryParams);

        const results = await connection.execute(query, queryParams);
        console.log('Search results:', results.rows);

        if (results.rows.length === 0) {
            return res.status(404).send('No books found with the given criteria');
        }

        // Transform rows into objects
        const books = results.rows.map(row => ({
            title: row[0],
            genre: row[1],
            author: row[2],
            ratings: row[3],
            bookImageUrl: row[4] // Assuming this is the URL field
        }));

        res.status(200).json({ totalBooks: books.length, books });
    } catch (err) {
        console.error('Error searching for books:', err);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

module.exports = router;
