
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 50", function(err) {
        if (err) console.log("Column stock might already exist: ", err.message);
        else console.log("Column stock added.");
    });
});
setTimeout(() => db.close(), 1000);
