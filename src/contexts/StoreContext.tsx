import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Task, Project, Vendor, InventoryItem, Status, Priority, PurchaseOrder } from '../types/shared';
import { resourceService } from '../services/resourceService';
import { financeService } from '../services/financeService';
import { VENDORS_DATA } from '../features/marketplace/vendorsData';

interface StoreState {
    users: User[];
    tasks: Task[];
    projects: Project[];
    vendors: Vendor[];
    inventory: InventoryItem[];
    purchaseOrders: PurchaseOrder[];

    // Actions
    addUser: (user: User) => void;
    updateUser: (id: string, updates: Partial<User>) => void;

    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;

    addProject: (project: Project) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;

    addVendor: (vendor: Vendor) => void;
    updateVendor: (id: string, updates: Partial<Vendor>) => void;

    addPurchaseOrder: (po: PurchaseOrder) => void;
    updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;

    // Computed
    getUserLoad: (userId: string) => number; // % capacity used
    getProjectBurnRate: (projectId: string) => number; // $/day
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within a StoreProvider');
    return context;
};

// --- Mock Data Initialization ---
const INITIAL_USERS: User[] = [
    { id: 'u1', name: 'Max', role: 'Admin', avatar: 'M', color: 'bg-blue-500', hourlyRate: 150, weeklyCapacity: 40 },
    { id: 'u2', name: 'Sarah', role: 'Manager', avatar: 'S', color: 'bg-green-500', hourlyRate: 120, weeklyCapacity: 40 },
];

const INITIAL_TASKS: Task[] = [
    {
        id: 't1', title: 'Setup Infrastructure', status: Status.InProgress, priority: Priority.High,
        assigneeId: 'u1', estimatedHours: 20, actualHours: 5,
        workflowTriggers: { onComplete: 't2' }
    },
    { id: 't2', title: 'Design Dashboard', status: Status.Todo, priority: Priority.Normal, assigneeId: 'u2', estimatedHours: 15 },
];

const INITIAL_PROJECTS: Project[] = [
    { id: 'p1', name: 'Alpha Launch', status: 'Active', budget: 50000, spent: 12000, startDate: new Date(), deadline: new Date(Date.now() + 86400000 * 30), managerId: 'u1', teamIds: [], health: 'Good' }
];

// Map VENDORS_DATA to match the shared Vendor interface if needed, or use as is if compatible
const INITIAL_VENDORS: Vendor[] = VENDORS_DATA.map(v => ({
    ...v,
    reliabilityScore: 95, // Default score
    contractStatus: 'Active',
    paymentTerms: 'Net30'
} as Vendor));

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- State ---
    const [users, setUsers] = useState<User[]>(() => {
        const saved = localStorage.getItem('ncs_users');
        return saved ? JSON.parse(saved) : INITIAL_USERS;
    });

    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem('ncs_tasks');
        return saved ? JSON.parse(saved) : INITIAL_TASKS;
    });

    const [projects, setProjects] = useState<Project[]>(() => {
        const saved = localStorage.getItem('ncs_projects');
        return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    });

    const [vendors, setVendors] = useState<Vendor[]>(() => {
        const saved = localStorage.getItem('ncs_vendors');
        return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    });

    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
        const saved = localStorage.getItem('ncs_pos');
        return saved ? JSON.parse(saved) : [];
    });

    // --- Persistence ---
    useEffect(() => localStorage.setItem('ncs_users', JSON.stringify(users)), [users]);
    useEffect(() => localStorage.setItem('ncs_tasks', JSON.stringify(tasks)), [tasks]);
    useEffect(() => localStorage.setItem('ncs_projects', JSON.stringify(projects)), [projects]);
    useEffect(() => localStorage.setItem('ncs_vendors', JSON.stringify(vendors)), [vendors]);
    useEffect(() => localStorage.setItem('ncs_pos', JSON.stringify(purchaseOrders)), [purchaseOrders]);

    // --- Actions ---
    const addUser = (user: User) => setUsers(prev => [...prev, user]);
    const updateUser = (id: string, updates: Partial<User>) => setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));

    const addTask = (task: Task) => setTasks(prev => [...prev, task]);

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prev => {
            const updatedTasks = prev.map(t => t.id === id ? { ...t, ...updates } : t);

            // Workflow Trigger Logic
            const task = updatedTasks.find(t => t.id === id);
            if (task && (task.status === Status.Complete || (updates.status as any) === 'Done') && task.workflowTriggers?.onComplete) {
                const nextTaskId = task.workflowTriggers.onComplete;
                return updatedTasks.map(t => t.id === nextTaskId ? { ...t, status: Status.InProgress } : t);
            }

            return updatedTasks;
        });
    };

    const addProject = (project: Project) => setProjects(prev => [...prev, project]);
    const updateProject = (id: string, updates: Partial<Project>) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    const addVendor = (vendor: Vendor) => setVendors(prev => [...prev, vendor]);
    const updateVendor = (id: string, updates: Partial<Vendor>) => setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

    const addPurchaseOrder = (po: PurchaseOrder) => setPurchaseOrders(prev => [...prev, po]);
    const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    // --- Computed ---
    const getUserLoad = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return 0;
        return resourceService.calculateUserLoad(user, tasks);
    };

    const getProjectBurnRate = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return 0;
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        return financeService.calculateProjectBurn(project, projectTasks, users);
    };

    return (
        <StoreContext.Provider value={{
            users, tasks, projects, vendors, inventory, purchaseOrders,
            addUser, updateUser, addTask, updateTask, addProject, updateProject,
            addVendor, updateVendor, addPurchaseOrder, updatePurchaseOrder,
            getUserLoad, getProjectBurnRate
        }}>
            {children}
        </StoreContext.Provider>
    );
};
