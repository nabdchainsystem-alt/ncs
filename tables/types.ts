import React from 'react';

export interface Task {
  id: string;
  name: string;
  status: string;
  dueDate: Date | null;
  priority: string | null;
  assignee?: string;
}

export enum ViewMode {
  List = 'List',
  Board = 'Board',
  Calendar = 'Calendar'
}

export interface SidebarItem {
  icon: React.ElementType;
  label: string;
  count?: number;
  active?: boolean;
}