export interface Room {
    id: string;
    name: string;
    color: string;
    ownerId: string;
    type: 'personal' | 'shared';
    createdAt: string;
    updatedAt: string;
}
