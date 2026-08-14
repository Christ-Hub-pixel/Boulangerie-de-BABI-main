
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE orders ADD COLUMN confirmation_code TEXT", function(err) {
        if (err) {
            console.log("Column might already exist or another error: ", err.message);
        } else {
            console.log("Column confirmation_code added.");
        }
    });
});
db.close();
