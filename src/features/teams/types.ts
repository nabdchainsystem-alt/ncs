export interface Member {
    id: string;
    name: string;
    role: 'Admin' | 'Editor' | 'Viewer';
    avatarUrl: string;
    status: 'online' | 'offline' | 'busy';
}

export interface Activity {
    id: string;
    userId: string;
    action: string;
    target: string;
    timestamp: string; // ISO string
}

export interface Project {
    id: string;
    name: string;
    status: 'In Progress' | 'Review' | 'Done' | 'Planning';
    progress: number;
    dueDate: string;
}

export interface Team {
    id: string;
    name: string;
    description: string;
    category: 'Design' | 'Engineering' | 'Marketing' | 'General';
    members: Member[];
    activities: Activity[];
    projects: Project[];
    unreadCount: number;
}

export interface Invitation {
    id: string;
    team_id: string;
    email: string;
    role: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
}
