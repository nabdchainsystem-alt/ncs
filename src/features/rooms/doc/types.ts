import React from 'react';

export interface NavItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    children?: NavItem[];
    type: 'folder' | 'doc' | 'list';
}

export type Theme = 'light' | 'dark';
