
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0", function(err) {
        if (err) console.log("Column points might already exist: ", err.message);
        else console.log("Column points added.");
    });
});
setTimeout(() => db.close(), 1000);
