import React from 'react';
import { ClipboardList, Loader2, Plus, Upload, PackagePlus, Boxes, Users, Wallet } from 'lucide-react';
import Board from 'react-trello';
import { toast } from 'react-hot-toast';

import PageHeader, { type PageHeaderItem } from '../components/layout/PageHeader';
import { StatCard } from '../components/shared';
import { useApiHealth } from '../context/ApiHealthContext';
import type { Task, TaskStatus } from '../types';
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from '../features/tasks/hooks';

type FiltersState = {
  q: string;
  assignee: string;
  tag: string;
};

type LaneId = 'open' | 'inprogress' | 'done';

const LANE_CONFIG: Array<{
  id: LaneId;
  title: string;
  status: TaskStatus;
  apiState: 'Open' | 'InProgress' | 'Done';
}> = [
  { id: 'open', title: 'Open', status: 'TODO', apiState: 'Open' },
  { id: 'inprogress', title: 'In Progress', status: 'IN_PROGRESS', apiState: 'InProgress' },
  { id: 'done', title: 'Done', status: 'COMPLETED', apiState: 'Done' },
];

const laneToState = new Map<LaneId, { status: TaskStatus; apiState: 'Open' | 'InProgress' | 'Done' }>(
  LANE_CONFIG.map((lane) => [lane.id, { status: lane.status, apiState: lane.apiState }]),
);

const PLACEHOLDER_PREFIX = 'placeholder-';

type TrelloCard = {
  id: string;
  title: string;
  description?: string;
  label?: string;
  metadata?: {
    taskId: number;
  };
  draggable?: boolean;
  hideCardDeleteIcon?: boolean;
};

type BoardData = {
  lanes: Array<{
    id: LaneId;
    title: string;
    cards: TrelloCard[];
    style?: React.CSSProperties;
    cardStyle?: React.CSSProperties;
    disallowAddingCard?: boolean;
  }>;
};

function formatDueDate(value?: string | null) {
  if (!value) return undefined;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('[tasks] Failed to format due date', error);
    return undefined;
  }
}

function buildBoardData(tasks: Task[]): BoardData {
  return {
    lanes: LANE_CONFIG.map((lane) => {
      const laneTasks = tasks
        .filter((task) => task.status === lane.status)
        .sort((a, b) => {
          const orderDiff = (a.order ?? 0) - (b.order ?? 0);
          if (orderDiff !== 0) return orderDiff;
          return (a.id ?? 0) - (b.id ?? 0);
        });

      if (laneTasks.length === 0) {
        return {
          id: lane.id,
          title: lane.title,
          disallowAddingCard: false,
          cards: [
            {
              id: `${PLACEHOLDER_PREFIX}${lane.id}`,
              title: 'No tasks',
              description: 'Drag tasks here or add a new one',
              draggable: false,
              hideCardDeleteIcon: true,
            },
          ],
          style: {
            backgroundColor: 'transparent',
          },
          cardStyle: {
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(226,232,240,1)',
          },
        };
      }

      return {
        id: lane.id,
        title: lane.title,
        disallowAddingCard: false,
        cards: laneTasks.map<TrelloCard>((task) => ({
          id: String(task.id),
          title: task.title || 'Untitled task',
          description: task.description ?? undefined,
          label: formatDueDate(task.dueDate) ?? undefined,
          metadata: { taskId: task.id },
        })),
        style: {
          backgroundColor: 'transparent',
        },
        cardStyle: {
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(226,232,240,1)',
        },
      };
    }),
  };
}

function FiltersBar({
  filters,
  onChange,
  assignees,
  tags,
  disabled,
}: {
  filters: FiltersState;
  onChange: (next: FiltersState) => void;
  assignees: string[];
  tags: string[];
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>Search</span>
          <input
            type="search"
            value={filters.q}
            onChange={(event) => onChange({ ...filters, q: event.currentTarget.value })}
            placeholder="Search tasks…"
            className="h-10 rounded-xl border px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-950"
            disabled={disabled}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>Assignee</span>
          <select
            value={filters.assignee}
            onChange={(event) => onChange({ ...filters, assignee: event.currentTarget.value })}
            className="h-10 rounded-xl border px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-950"
            disabled={disabled}
          >
            <option value="">All</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span>Tag</span>
          <select
            value={filters.tag}
            onChange={(event) => onChange({ ...filters, tag: event.currentTarget.value })}
            className="h-10 rounded-xl border px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-950"
            disabled={disabled}
          >
            <option value="">All</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function TasksKpis({ tasks }: { tasks: Task[] }) {
  const counts = React.useMemo(() => {
    return LANE_CONFIG.map((lane) => ({
      lane,
      total: tasks.filter((task) => task.status === lane.status).length,
    }));
  }, [tasks]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {counts.map(({ lane, total }) => (
        <StatCard
          key={lane.id}
          icon={<ClipboardList className="h-5 w-5" />}
          label={lane.title}
          value={total}
          valueFormat="number"
        />
      ))}
    </div>
  );
}

export default function TasksListPage() {
  const { disableWrites, healthy } = useApiHealth();
  const [filters, setFilters] = React.useState<FiltersState>({ q: '', assignee: '', tag: '' });

  const queryParams = React.useMemo(
    () => ({
      q: filters.q.trim() || undefined,
      assignee: filters.assignee || undefined,
      tag: filters.tag || undefined,
    }),
    [filters],
  );

  const { data: tasks, isLoading, isFetching, refetch } = useTasks(queryParams);
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const assigneeOptions = React.useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => {
      if (task.assignee) set.add(task.assignee);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const tagOptions = React.useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => {
      if (Array.isArray(task.tags)) {
        task.tags.filter(Boolean).forEach((tag) => set.add(tag!));
      }
      if (task.label) set.add(task.label);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const boardData = React.useMemo(() => buildBoardData(tasks), [tasks]);

  const handleDragEnd = React.useCallback(
    async (
      cardId: string,
      _sourceLaneId: LaneId,
      targetLaneId: LaneId,
      position: number,
    ) => {
      if (cardId.startsWith(PLACEHOLDER_PREFIX)) return false;
      if (disableWrites) {
        toast.error('Backend unavailable. Task updates are disabled.');
        return false;
      }

      const mapping = laneToState.get(targetLaneId);
      if (!mapping) return false;

      try {
        await updateTaskMutation.mutateAsync({
          id: cardId,
          patch: {
            state: mapping.apiState,
            status: mapping.status,
            order: position,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to move task';
        toast.error(message);
        await refetch();
        return false;
      }
      return true;
    },
    [disableWrites, refetch, updateTaskMutation],
  );

  const handleCardAdd = React.useCallback(
    async (card: TrelloCard, laneId: LaneId) => {
      if (disableWrites) {
        toast.error('Backend unavailable. Task creation is disabled.');
        return false;
      }
      const title = card.title?.trim();
      if (!title) {
        toast.error('Task title is required.');
        return false;
      }
      const mapping = laneToState.get(laneId);
      if (!mapping) return false;
      try {
        await createTaskMutation.mutateAsync({
          title,
          state: mapping.apiState,
          status: mapping.status,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create task';
        toast.error(message);
        await refetch();
        return false;
      }
      return true;
    },
    [createTaskMutation, disableWrites, refetch],
  );

  const handleCardDelete = React.useCallback(
    async (cardId: string, _laneId: LaneId) => {
      if (cardId.startsWith(PLACEHOLDER_PREFIX)) return false;
      if (disableWrites) {
        toast.error('Backend unavailable. Task deletion is disabled.');
        return false;
      }
      try {
        await deleteTaskMutation.mutateAsync(cardId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete task';
        toast.error(message);
        await refetch();
        return false;
      }
      return true;
    },
    [deleteTaskMutation, disableWrites, refetch],
  );

  const handleCardClick = React.useCallback((cardId: string) => {
    if (cardId.startsWith(PLACEHOLDER_PREFIX)) return;
    toast('Task details coming soon');
  }, []);

  const menuItems = React.useMemo<PageHeaderItem[]>(() => [
    {
      key: 'add-task',
      label: 'Add Task',
      icon: <Plus className="h-4.5 w-4.5" />,
      onClick: () => {
        toast('Use the lane “Add Card” buttons to create a task.');
      },
      disabled: disableWrites,
      comingSoonMessage: disableWrites ? 'Backend unavailable' : undefined,
    },
    { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-4.5 h-4.5" />, disabled: true },
    { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-4.5 h-4.5" />, disabled: true },
    { key: 'import-materials', label: 'Import Materials', icon: <Boxes className="w-4.5 h-4.5" />, disabled: true },
    { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" />, disabled: true },
    { key: 'new-payment-request', label: 'New Payment Request', icon: <Wallet className="w-4.5 h-4.5" />, disabled: true },
  ], [disableWrites]);

  const showEmptyState = !isLoading && tasks.length === 0;

  return (
    <div className="flex flex-1 flex-col gap-5 p-6">
      {!healthy ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Backend unavailable. Task updates are disabled until the connection returns.
        </div>
      ) : null}

      <PageHeader title="Tasks" showSearch={false} menuItems={menuItems} />

      <FiltersBar filters={filters} onChange={setFilters} assignees={assigneeOptions} tags={tagOptions} disabled={isLoading} />

      <TasksKpis tasks={tasks} />

      <div className="relative flex-1 overflow-hidden rounded-2xl border bg-gray-50 shadow-inner dark:border-gray-800 dark:bg-gray-950">
        {(isLoading || isFetching) && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-gray-950/70">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm font-medium">Syncing tasks…</span>
          </div>
        )}

        <div className="h-full overflow-auto p-4">
          <Board
            data={boardData}
            draggable={!disableWrites}
            cardDraggable={!disableWrites}
            laneDraggable={false}
            editable={!disableWrites}
            canAddLanes={false}
            hideCardDeleteIcon={disableWrites}
            handleDragEnd={handleDragEnd as any}
            onCardAdd={handleCardAdd as any}
            onCardDelete={handleCardDelete as any}
            onCardClick={(cardId: string) => handleCardClick(cardId)}
            style={{
              background: 'transparent',
              minHeight: '500px',
            }}
            cardDragClass="opacity-75"
          />
        </div>

        {showEmptyState ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border bg-white/90 px-6 py-8 text-center shadow-card dark:border-gray-800 dark:bg-gray-900/95">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No tasks yet</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Use the “Add Card” action in any lane to create your first task.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
