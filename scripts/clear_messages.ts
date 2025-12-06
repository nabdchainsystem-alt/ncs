import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src/data/db/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

if (db.discussion_messages) {
    db.discussion_messages = [];
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Cleared discussion_messages');
