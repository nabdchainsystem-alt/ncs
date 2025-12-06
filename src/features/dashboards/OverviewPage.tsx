import React, { useState, useMemo } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { Status } from '../../types/shared';
import { OverviewDashboard } from './components/OverviewDashboard';

const OverviewPage: React.FC = () => {
    const { users, tasks } = useStore();


    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    // Mock Data for specific UI requirements not fully covered by store yet
    const reminders = [
        { text: "Review Q4 budget proposal", time: "2:00 PM" },
        { text: "Send investor updates", time: "4:30 PM" },
        { text: "Call with design team", time: "Tomorrow" },
        { text: "Update license keys", time: "Dec 10" },
    ];

    const events = [
        { title: "Product Sync", startHour: 10, duration: "1h" },
        { title: "Team Lunch", startHour: 12, duration: "1h 30m" },
        { title: "Focus Time", startHour: 14, duration: "2h" },
    ];

    // Filter tasks for "Today" (simulated by incomplete tasks for now)
    const todayTasks = useMemo(() => {
        return tasks
            .filter(t => t.status !== Status.Complete)
            .map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                priority: t.priority,
                dueTime: 'Today', // Placeholder as store task might not have time
                status: t.status
            }))
            .slice(0, 12); // Limit for the UI view
    }, [tasks]);

    const activeUser = users[0]; // Assuming first user is active for 'Max' placeholder

    return (
        <OverviewDashboard
            tasks={todayTasks}
            reminders={reminders}
            events={events}
            greeting={greeting}
            userName={activeUser?.name || 'Max'}
        />
    );
};

export default OverviewPage;
