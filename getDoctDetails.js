// Import MySQL library
const mysql = require('mysql');

// Example function to fetch user details from a MySQL database
function getDoctDetails(username, callback) {
    // Create a MySQL connection
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'businessdb'
    });

    // Connect to the database
    connection.connect((err) => {
        if (err) {
            // If connection fails, invoke the callback with error
            callback(err);
            return;
        }

        // Execute a query to fetch user details by username
        const query = `SELECT name FROM doctors WHERE name = ?`;
        connection.query(query, [username], (err, results) => {
            // Close the connection
            connection.end();

            if (err) {
                // If query execution fails, invoke the callback with error
                callback(err);
                return;
            }

            if (results.length === 0) {
                // If no user found with the provided username, invoke the callback with an error
                callback(new Error('User not found'));
                return;
            }

            // Extract user details from the query results
            const userDetails = {
                name: results[0].name,
               
                // Add more user details as needed
            };

            // Invoke the callback with user details
            callback(null, userDetails);
        });
    });
}

module.exports = getDoctDetails;
