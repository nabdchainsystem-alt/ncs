
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src/data/db/db.json');

const INITIAL_CHANNELS = [
    { id: 'c1', name: 'general', type: 'public', category: 'Favorites', members: ['u1', 'u2', 'u3', 'u4'] },
    { id: 'c2', name: 'design-system', type: 'public', unreadCount: 3, category: 'Favorites', members: ['u1', 'u3'] },
    { id: 'c3', name: 'engineering', type: 'private', category: 'Channels', members: ['u2', 'u3'] },
    { id: 'c4', name: 'marketing', type: 'public', category: 'Channels', members: ['u4'] },
    { id: 'd1', name: 'Sarah Chen', type: 'dm', status: 'online', avatar: 'bg-emerald-500', category: 'Direct Messages' },
    { id: 'd2', name: 'Ahmed Hassan', type: 'dm', status: 'busy', avatar: 'bg-purple-500', category: 'Direct Messages' },
];

const INITIAL_MESSAGES = [
    {
        id: 1,
        sender: 'System',
        senderAvatar: '',
        content: 'Welcome to #design-system! This channel is for discussing components, tokens, and layouts.',
        time: 'Yesterday',
        isMe: false,
        type: 'system'
    },
    {
        id: 2,
        sender: 'Sarah Chen',
        senderAvatar: 'bg-emerald-500',
        content: 'Hey team! I just updated the Figma library with the new "Glass" tokens. Please sync your plugins.',
        time: '10:30 AM',
        reactions: [{ emoji: '🔥', count: 3, userReacted: false }, { emoji: '👀', count: 1, userReacted: true }],
        isMe: false,
        type: 'text'
    },
    {
        id: 3,
        sender: 'Max',
        senderAvatar: 'bg-blue-600',
        content: 'Awesome, checking it out now. The blur consistency looks much better in the preview.',
        time: '10:32 AM',
        isMe: true,
        type: 'text'
    },
    {
        id: 4,
        sender: 'Ahmed Hassan',
        senderAvatar: 'bg-purple-500',
        content: 'Can we also check the RTL support for the new sidebar component? I noticed some padding issues in the implementation.',
        time: '10:45 AM',
        isMe: false,
        type: 'text'
    },
];

const INITIAL_TASKS = [
    { id: 't1', channelId: 'c2', title: 'Review Figma Tokens', status: 'todo', priority: 'high', date: 'Today', tags: ['Design'] },
    { id: 't2', channelId: 'c2', title: 'Update Tailwind Config', status: 'processing', priority: 'medium', date: 'Oct 25', tags: ['Dev'] },
];

const INITIAL_NOTES = [
    { id: 'n1', channelId: 'c2', content: 'Remember to check contrast ratios for dark mode.', priority: 'high', date: 'Today', dueDate: 'Fri' },
];

const AVAILABLE_TAGS = [
    { id: 'design', label: 'Design', color: 'bg-pink-500' },
    { id: 'dev', label: 'Development', color: 'bg-blue-500' },
    { id: 'bug', label: 'Bug', color: 'bg-red-500' },
    { id: 'feature', label: 'Feature', color: 'bg-purple-500' },
    { id: 'marketing', label: 'Marketing', color: 'bg-yellow-500' },
];

try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(data);

    db.discussion_channels = INITIAL_CHANNELS;
    db.discussion_messages = INITIAL_MESSAGES;
    db.discussion_tasks = INITIAL_TASKS;
    db.discussion_notes = INITIAL_NOTES;
    db.discussion_tags = AVAILABLE_TAGS;

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('db.json updated successfully');
} catch (err) {
    console.error('Error updating db.json:', err);
}
