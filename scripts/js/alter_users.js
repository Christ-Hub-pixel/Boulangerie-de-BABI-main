
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(async () => {
    db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'", function(err) {
        if (err) console.log("Column role might already exist: ", err.message);
        else console.log("Column role added.");
    });
    
    // Check if admin exists
    db.get("SELECT * FROM users WHERE email = 'admin@babi.ci'", async (err, row) => {
        if(!row) {
            const hashed = await bcrypt.hash('admin123', 10);
            db.run("INSERT INTO users (nom, email, telephone, mot_de_passe, role) VALUES (?, ?, ?, ?, ?)",
                ['Gérant Principal', 'admin@babi.ci', '0000', hashed, 'admin'], (err) => {
                    if(err) console.error(err);
                    else console.log("Admin account created.");
                });
        } else {
            console.log("Admin account already exists.");
        }
    });
});
setTimeout(() => db.close(), 1000);
