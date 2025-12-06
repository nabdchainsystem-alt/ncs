const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src/data/db/db.json');

try {
    console.log('Reading DB from:', dbPath);
    const data = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(data);

    if (db.discussion_messages) {
        console.log(`Found ${db.discussion_messages.length} messages. Clearing...`);
        db.discussion_messages = [];
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log('Successfully cleared discussion_messages.');
    } else {
        console.log('No discussion_messages key found.');
    }
} catch (error) {
    console.error('Error modifying DB:', error);
    process.exit(1);
}
