import { Permissions, DEFAULT_PERMISSIONS } from '../types/shared';

const PERMISSIONS_KEY = 'user_permissions';

export const permissionService = {
    getPermissions: (email: string): Permissions => {
        if (!email) return DEFAULT_PERMISSIONS;

        // Master account always has full access
        if (email === 'master@nabdchain.com') {
            return { ...DEFAULT_PERMISSIONS };
        }

        try {
            const stored = localStorage.getItem(PERMISSIONS_KEY);
            const allPermissions = stored ? JSON.parse(stored) : {};

            // If user has no permissions set, return DEFAULT_PERMISSIONS (all true)
            // This ensures users see everything by default until restricted.
            if (!allPermissions[email]) {
                return { ...DEFAULT_PERMISSIONS };
            }

            return { ...DEFAULT_PERMISSIONS, ...allPermissions[email] };
        } catch (e) {
            console.error('Failed to load permissions', e);
            return DEFAULT_PERMISSIONS;
        }
    },

    savePermissions: (email: string, permissions: Permissions) => {
        try {
            const stored = localStorage.getItem(PERMISSIONS_KEY);
            const allPermissions = stored ? JSON.parse(stored) : {};
            allPermissions[email] = permissions;
            localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(allPermissions));
        } catch (e) {
            console.error('Failed to save permissions', e);
        }
    },

    getAllUsers: () => {
        return [
            { email: 'max@nabdchain.com', name: 'Max' },
            { email: 'hasan@nabdchain.com', name: 'Hasan' }
        ];
    }
};
