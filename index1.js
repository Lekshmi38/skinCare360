const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const mysql = require('mysql');
const path = require('path');

const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const upload = multer({ dest: 'uploads/' });
app.set('view engine', 'ejs');

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'secret_key', // Change this to a more secure value
    resave: true,
    saveUninitialized: true
}));

// MySQL connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '', // Replace with your MySQL password
    database: 'businessdb'
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.get('/public', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/image', (req, res) => {
    res.render('index1', { textWithBenefits: [] }); // Initialize textWithBenefits
});
app.get('/doctors', (req, res) => {
    res.sendFile(path.join(__dirname, 'consultation', 'main.html'));
});
app.get('/awarness', (req, res) => {
    res.sendFile(path.join(__dirname, 'aware', 'awarness.html'));
});
app.get('/patient', (req, res) => {
    res.sendFile(path.join(__dirname, 'consultation', 'patient.html'));
});
app.get('/doct', (req, res) => {
    res.sendFile(path.join(__dirname, 'consultation', 'doct.html'));
});
// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT pass FROM users WHERE name = ?', [username], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            return res.status(500).send('An error occurred. Please try again later.');
        }

        if (results.length === 0) {
            return res.send('<script>alert("User not registered"); window.location.href="/";</script>');
        }

        const user = results[0];
        bcrypt.compare(password, user.pass, (err, result) => {
            if (result) {
                req.session.username = username;
                return res.redirect('/user'); // Redirect to the user dashboard or profile
            } else {
                return res.send('<script>alert("Wrong Password"); window.location.href="/login";</script>');
            }
        });
    });
});

// Signup route
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('An error occurred. Please try again later.');
        }

        // Store the username and hashed password in the database
        connection.query('INSERT INTO users (name, pass) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query:', err);
                return res.status(500).send('An error occurred. Please try again later.');
            }
            
            // Redirect to login page after successful registration
            res.redirect('/');
        });
    });
});
app.post('/login2', (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT pass FROM doctors WHERE name = ?', [username], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            return res.status(500).send('An error occurred. Please try again later.');
        }

        if (results.length === 0) {
            return res.send('<script>alert("User not registered"); window.location.href="/";</script>');
        }
     
        const doctor = results[0]; // Renamed variable to `doctor`
        const retrievedPassword = doctor.pass.trim(); // Trim whitespace from retrieved password
         
        bcrypt.compare(password, retrievedPassword, (err, result) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send('Internal server error');
            }
            console.log(result);
                req.session.username = username;
                return res.redirect('/doctor');
         
        });
    });
});

// Signup route
app.post('/signup2', (req, res) => {
    const { username, password } = req.body;

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('An error occurred. Please try again later.');
        }

        // Store the username and hashed password in the database
        connection.query('INSERT INTO doctors (name, pass) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query:', err);
                return res.status(500).send('An error occurred. Please try again later.');
            }
            
            // Redirect to login page after successful registration
            res.redirect('/doctor');
        });
    });
});


// Assuming you have a function to fetch user details from the database
const getUserDetails = require('./getUserDetails');


app.get('/user', (req, res) => {
    const username = req.session.username;
    if (!username) {
        return res.redirect('/');
    }

    // Fetch user details from the database
    getUserDetails(username, (err, userDetails) => {
        if (err) {
            console.error('Error fetching user details:', err);
            // Handle error appropriately, e.g., render an error page
            return res.status(500).send('Error fetching user details');
        }

        // Render the user.html template with the provided data
        res.render('user', { username, userDetails });
    });
});
app.post('/submit_tips', (req, res) => {
    const tip = req.body.tip;
    const username = req.body.user;
  
    // Insert the tip into the database
    const query = 'INSERT INTO awarness (name, tip) VALUES (?, ?)';
    connection.query(query, [username, tip], (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      console.log('Skin health tip inserted successfully');
      res.status(200).json( 'Skin health tip submitted successfully' );
    });
  });
  app.post('/view_tip', (req, res) => {
    // Fetch health tips from the database
    const query = 'SELECT * FROM awarness';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      // If tips are retrieved successfully, send them to the client
      res.status(200).json(results);
    });
  });
  app.post('/submit_product_review', (req, res) => {
    const tip = req.body.productName;
    const username = req.body.productReview;
  
    // Insert the tip into the database
    const query = 'INSERT INTO product (name, review) VALUES (?, ?)';
    connection.query(query, [username, tip], (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      console.log('Skin health tip inserted successfully');
      res.status(200).json( 'Skin health tip submitted successfully' );
    });
  });
  app.post('/view_product_reviews', (req, res) => {
    // Fetch health tips from the database
    const query = 'SELECT * FROM product';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      // If tips are retrieved successfully, send them to the client
      res.status(200).json(results);
    });
  });

// Route to fetch all users from the database
app.get('/users', (req, res) => {
    
    connection.query('SELECT name FROM doctors', (err, results) => {
        if (err) {
            console.error('Error querying MySQL:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        const users = results.map(row => row.name);
        res.json({ users });
    });
});




// Listen for new connections
io.on('connection', (socket) => {
    //console.log('A user connected');

    // Listen for 'login' event from clients
    socket.on('login', async (username) => {
        // Check if the username exists in the database
        connection.query('SELECT * FROM users WHERE name = ?', [username], (err, results) => {
            if (err) {
                console.error('Error querying MySQL:', err);
                return;
            }

            if (results.length === 0) {
                console.log(`User ${username} does not exist`);
                return;
            }

            console.log(`User ${username} logged in`);

            // Fetch notifications for the user from the database
            connection.query('SELECT receipent, disease,age FROM notifications WHERE sender = ?', [username], (err, notificationResults) => {
                if (err) {
                    console.error('Error querying MySQL:', err);
                    return;
                }

                // Emit notifications to the user
                notificationResults.forEach(notification => {
                    socket.emit('notification', {
                        sender: notification.sender,
                       
                        receipent: notification.recipient,
                         disease: notification.disease,
                        age: notification.age
                    });
                });
            });
        });
    });

    // Listen for 'notification' event from clients
   // Listen for 'notification' event from clients
socket.on('notification', (data) => {
    console.log('Notification received:', data);

    // Store the notification in the database
    connection.query('INSERT INTO notifications (sender, receipent, disease, age) VALUES (?, ?, ?, ?)', [data.sender, data.recipient, data.disease, data.age], (err) => {
        if (err) {
            console.error('Error inserting notification into MySQL:', err);
            return;
        }
        console.log('Notification stored in the database');
    });

    // Broadcast the received notification to the intended recipient
    io.to(data.recipient).emit('notification', data); // Sending to the doctor
  // Sending back to the sender
});


    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


const getDoctDetails = require('./getDoctDetails');


app.get('/doctor', (req, res) => {
    const username = req.session.username;
    if (!username) {
        return res.redirect('/');
    }

    // Fetch user details from the database
    getDoctDetails(username, (err, userDetails) => {
        if (err) {
            console.error('Error fetching user details:', err);
            // Handle error appropriately, e.g., render an error page
            return res.status(500).send('Error fetching user details');
        }

        // Render the user.html template with the provided data
        res.render('doctor', { username, userDetails });
    });
});


// Route to fetch all users from the database
/* app.get('/doctor2', (req, res) => {
    
    connection.query('SELECT name FROM doctors', (err, results) => {
        if (err) {
            console.error('Error querying MySQL:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        const users = results.map(row => row.name);
        res.json({ users });
    });
}); */

// Listen for new connections
io.on('connection', (socket) => {
    //console.log('A user connected');

    // Listen for 'login' event from clients
    socket.on('loginn', async (username) => {
        // Check if the username exists in the database
        connection.query('SELECT * FROM doctors WHERE name = ?', [username], (err, results) => {
            if (err) {
                console.error('Error querying MySQL:', err);
                return;
            }

            if (results.length === 0) {
                console.log(`User ${username} does not exist`);
                return;
            }

            console.log(`User ${username} logged in`);

            // Fetch notifications for the user from the database
            connection.query('SELECT sender,disease,age FROM notifications WHERE receipent = ?', [username], (err, notificationResults) => {
                if (err) {
                    console.error('Error querying MySQL:', err);
                    return;
                }

                // Emit notifications to the user
                notificationResults.forEach(notification => {
                    socket.emit('notification', {
                        sender: notification.sender,
                        disease: notification.disease,
                        age:notification.age
                    });
                });
            });
        });
    });

    // Listen for 'notification' event from clients
    socket.on('notification', (data) => {
        console.log('Notification received:', data);

        // Store the notification in the database
        connection.query('INSERT INTO notifications (sender,receipent, disease, age) VALUES (?, ?, ?,?)', [data.sender, data.recipient, data.disease,data.age], (err) => {
            if (err) {
                console.error('Error inserting notification into MySQL:', err);
                return;
            }
            console.log('Notification stored in the database');
        });

        // Broadcast the received notification to the intended recipient
        io.to(data.recipient).emit('notification', data);
     
    });


    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});



// Serve HTML form
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Login</title>
        </head>
        <body>
            <h2>User Login</h2>
            <form action="/login" method="POST">
                <div>
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div>
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit">Login</button>
            </form>
        </body>
        </html>
    `);
});

// Upload route
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No files were uploaded.');
    }
    const imagePath = req.file.path;

    Tesseract.recognize(
        imagePath,
        'eng'
    ).then(({ data: { text } }) => {
        const cleanedText = text.replace(/[^\w\s,]/g, '');
        const wordsArray = cleanedText.trim().toLowerCase().split(/\s*,\s*|\s+/);
      console.log(wordsArray);
        const promises = [];
        const promises2 = [];
        wordsArray.forEach(word => {
            const promise = new Promise((resolve, reject) => {
                connection.query('SELECT benefits, skin_type FROM image_data WHERE name = ?', [word], (error, results) => {
                    if (error) {
                        console.error('Error retrieving benefits:', error);
                        reject(error);
                    } else {
                        if (results.length > 0) {
                            resolve({ word: word, description: results[0].benefits, skin: results[0].skin_type });
                        } else {
                            resolve(null);
                        }
                    }
                });

            });
            promises.push(promise);
        });

        wordsArray.forEach(word => {
            const promise = new Promise((resolve, reject) => {
                connection.query('SELECT name FROM chemicals WHERE name = ?', [word], (error, results) => {
                    if (error) {
                        console.error('Error retrieving chemicals:', error);
                        reject(error);
                    } else {
                        if (results.length > 0) {
                            resolve({ name: results[0].name });
                            console.log(results[0].name);
                        } else {
                            resolve(null);
                        }
                    }
                });

            });
            promises2.push(promise);
        });

        Promise.all([Promise.all(promises), Promise.all(promises2)])
        .then(([benefitsResults, chemicalsResults]) => {
            const textWithBenefits = benefitsResults.filter(result => result !== null);
        const textWithChemicals = chemicalsResults.filter(result => result !== null);
        console.log("Text with Benefits:", textWithBenefits);
        console.log("Text with Chemicals:", textWithChemicals);


        // Pass chemicalNames to the template
        res.render('index1', { textWithBenefits, textWithChemicals });
        })
        
    
            .catch(error => {
                res.status(500).send('Error occurred during text extraction.');
            });

    }).catch(error => {
        res.status(500).send('Error occurred during text extraction.');
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
