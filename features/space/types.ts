export interface Space {
    id: string;
    name: string;
    color: string; // hex code
    ownerId?: string;
    type?: 'personal' | 'department' | 'shared';
}
