import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../../types/shared';
import { authService, MOCK_USERS } from '../../../services/auth';
import { X } from 'lucide-react';

interface RecipientInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    theme?: string;
}

export const RecipientInput: React.FC<RecipientInputProps> = ({
    value,
    onChange,
    className = "",
    placeholder = "To",
    theme
}) => {
    // Initialize with empty array to verify loading state works
    const [users, setUsers] = useState<User[]>([]);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDark = theme === 'dark' || theme === 'nexus' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                // Always try to fetch real users first
                const realUsers = await authService.getUsers();
                if (realUsers && realUsers.length > 0) {
                    setUsers(realUsers);
                } else {
                    // Fallback to mocks if backend empty (dev mode)
                    console.log("No backend users found, using mocks");
                    setUsers(MOCK_USERS as User[]);
                }
            } catch (e) {
                console.error("Autocomplete load failed", e);
                setUsers(MOCK_USERS as User[]);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        if (!value || value.includes('@')) {
            // Assume if typing email or empty, might not show name suggestions unless specifically partial
            // But let's show suggestions if partial match on name OR email
            if (!value) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }
        }

        const lowerVal = value.toLowerCase();
        const matches = users.filter(u =>
            (u.name && u.name.toLowerCase().includes(lowerVal)) ||
            (u.email && u.email.toLowerCase().includes(lowerVal))
        );

        // Don't show if the only match is exactly what's typed
        if (matches.length === 1 && matches[0].email.toLowerCase() === lowerVal) {
            setSuggestions([]);
            setShowSuggestions(false);
        } else {
            setSuggestions(matches);
            setShowSuggestions(matches.length > 0);
        }
    }, [value, users]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (user: User) => {
        onChange(user.email);
        setShowSuggestions(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-transparent outline-none ${isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />

            {showSuggestions && (
                <div className={`absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-md shadow-lg border ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-200'
                    }`}>
                    {suggestions.length > 0 ? (
                        suggestions.map(user => (
                            <div
                                key={user.id}
                                onClick={() => handleSelect(user)}
                                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${user.color ? '' : 'bg-blue-500'}`} style={{ backgroundColor: user.color }}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        user.name?.charAt(0) || 'U'
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {user.name}
                                    </span>
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={`px-3 py-2 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            No users found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
