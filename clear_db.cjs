
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src/data/db/db.json');

try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(data);

    db.discussion_channels = [];
    db.discussion_messages = [];
    db.discussion_tasks = [];
    db.discussion_notes = [];
    // db.discussion_tags = []; // Keep tags? The user said "mockup data". Tags are usually config. I'll keep them for now unless asked, or maybe clear them too if they look "mocky".
    // The previous script added:
    // { id: 'design', label: 'Design', color: 'bg-pink-500' }...
    // These look like "available system tags". I'll keep them as they are useful config, not user data.

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('db.json discussion data cleared successfully');
} catch (err) {
    console.error('Error updating db.json:', err);
}
