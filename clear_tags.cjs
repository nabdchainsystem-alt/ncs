const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src/data/db/db.json');

try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    db.discussion_tags = [];

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('Successfully cleared discussion_tags from db.json');
} catch (error) {
    console.error('Error clearing db:', error);
}
