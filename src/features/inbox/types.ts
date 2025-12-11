export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    subject: string;
    preview: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    recipientId: string;
    tags: ('inbox' | 'sent' | 'archived' | 'starred')[];
    snoozedUntil?: string;
    attachments?: { id: string; name: string; type: string; url: string }[];
    tasks?: { id: string; title: string; description: string; status: string; sourceEmailId?: string }[];
    notes?: { id: string; title: string; description: string }[];
}

export interface InboxItem {
    id: string;
    content: string;
    createdAt: Date;
    status: 'inbox' | 'clarified' | 'organized' | 'done';
    aiSuggestions?: AISuggestion;
    isRead?: boolean;
    subject?: string;
    sender?: string;
    isFocused?: boolean;
}

export interface AISuggestion {
    suggestedProject: string;
    suggestedContext: string; // e.g., @home, @work
    nextAction: string;
    reasoning: string;
}

export enum ViewState {
    INBOX = 'INBOX',
    PROJECTS = 'PROJECTS',
    NEXT_ACTIONS = 'NEXT_ACTIONS',
}

export interface Translations {
    newMail: string;
    capture: string;
    inbox: string;
    archive: string;
    drafts: string;
    sent: string;
    deleted: string;
    history: string;
    junk: string;
    folders: string;
    createFolder: string;
    capturePlaceholder: string;
    save: string;
    delete: string;
    reply: string;
    replyAll: string;
    forward: string;
    move: string;
    flag: string;
    sync: string;
    block: string;
    print: string;
    more: string;
    from: string;
    to: string;
    subject: string;
    send: string;
    discard: string;
    attach: string;
    signature: string;
    editor: string;
    checkAccess: string;
    smartProcessing: string;
    clarifyAi: string;
    thinking: string;
    aiResult: string;
    nextAction: string;
    project: string;
    context: string;
    why: string;
    edit: string;
    confirm: string;
    selectItem: string;
    undo: string;
    importance: string;
    cc: string;
    bcc: string;
    personal: string;
    receipts: string;
    travel: string;
    work: string;
    writeDown: string;
    search: string;
    inboxZero: string;
}
