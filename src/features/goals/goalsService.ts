import { v4 as uuidv4 } from 'uuid';

export interface KeyResult {
    id: string;
    title: string;
    current: number;
    target: number;
    unit: string;
    confidence: 'high' | 'medium' | 'low';
    owner: string;
}

export interface Objective {
    id: string;
    title: string;
    progress: number;
    status: 'on-track' | 'at-risk' | 'off-track';
    keyResults: KeyResult[];
    expanded?: boolean;
}

// Initial Mock Data
const INITIAL_OBJECTIVES: Objective[] = [
    {
        id: '1',
        title: 'Scale Revenue to $10M ARR',
        progress: 65,
        status: 'on-track',
        expanded: true,
        keyResults: [
            { id: 'kr1', title: 'Close 5 Enterprise Deals', current: 3, target: 5, unit: 'deals', confidence: 'high', owner: 'Sales' },
            { id: 'kr2', title: 'Reduce Churn to < 2%', current: 2.4, target: 2.0, unit: '%', confidence: 'medium', owner: 'Success' },
            { id: 'kr3', title: 'Launch Self-Serve Plan', current: 80, target: 100, unit: '%', confidence: 'high', owner: 'Product' }
        ]
    },
    {
        id: '2',
        title: 'Become the #1 Rated App in Category',
        progress: 42,
        status: 'at-risk',
        expanded: true,
        keyResults: [
            { id: 'kr4', title: 'Achieve NPS of 70+', current: 58, target: 70, unit: 'score', confidence: 'low', owner: 'Product' },
            { id: 'kr5', title: 'Reduce App Load Time to 500ms', current: 800, target: 500, unit: 'ms', confidence: 'medium', owner: 'Eng' }
        ]
    },
    {
        id: '3',
        title: 'Build a World-Class Team',
        progress: 88,
        status: 'on-track',
        expanded: false,
        keyResults: [
            { id: 'kr6', title: 'Hire 5 Senior Engineers', current: 4, target: 5, unit: 'hires', confidence: 'high', owner: 'HR' },
            { id: 'kr7', title: 'Launch Internal Training Academy', current: 100, target: 100, unit: '%', confidence: 'high', owner: 'HR' }
        ]
    }
];

class GoalsService {
    private objectives: Objective[] = INITIAL_OBJECTIVES;
    private listeners: (() => void)[] = [];

    getObjectives(): Objective[] {
        return this.objectives;
    }

    addObjective(objective: Omit<Objective, 'id'>): Objective {
        const newObjective = { ...objective, id: uuidv4() };
        this.objectives = [newObjective, ...this.objectives];
        this.notify();
        return newObjective;
    }

    updateObjective(id: string, updates: Partial<Objective>): void {
        this.objectives = this.objectives.map(obj =>
            obj.id === id ? { ...obj, ...updates } : obj
        );
        this.notify();
    }

    deleteObjective(id: string): void {
        this.objectives = this.objectives.filter(obj => obj.id !== id);
        this.notify();
    }

    subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }
}

export const goalsService = new GoalsService();
