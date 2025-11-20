import React from 'react';
import { X, ListTodo, ClipboardList, MessageSquare, ListOrdered, Clock, Sparkles, History, Calendar, Plus } from 'lucide-react';
import { useToast } from './Toast';

interface AddCardsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: { id: string; title: string; color: string }) => void;
  onRemoveCard: (typeId: string) => void;
  addedCardTypes: string[];
}

const CARDS = [
  {
    id: 'standup',
    title: 'AI StandUp™',
    desc: 'AI generated standup.',
    icon: Sparkles,
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    isNew: true
  },
  {
    id: 'recents',
    title: 'Recents',
    desc: 'A list of all the ClickUp objects and locations you\'ve recently viewed.',
    icon: History,
    color: 'bg-sky-500'
  },
  {
    id: 'agenda',
    title: 'Agenda',
    desc: 'Visualize tasks and events on your different calendars in one place.',
    icon: Calendar,
    color: 'bg-pink-500'
  },
  {
    id: 'mywork',
    title: 'My Work',
    desc: 'A list for all of your assigned tasks and reminders.',
    icon: ListTodo,
    color: 'bg-blue-500'
  },
  {
    id: 'assigned',
    title: 'Assigned to me',
    desc: 'Consolidate your tasks across different lists that you have as an assignee.',
    icon: ListTodo,
    color: 'bg-blue-400'
  },
  {
    id: 'personal',
    title: 'Personal List',
    desc: 'Keep track of your personal tasks in a list that is only visible to you.',
    icon: ClipboardList,
    color: 'bg-purple-500'
  },
  {
    id: 'comments',
    title: 'Assigned Comments',
    desc: 'Resolve and view any comment that has been assigned to you.',
    icon: MessageSquare,
    color: 'bg-teal-500'
  },
  {
    id: 'lineup',
    title: 'Priorities (LineUp)',
    desc: 'Prioritize your most important tasks into one concise list.',
    icon: ListOrdered,
    color: 'bg-indigo-500'
  },
  {
    id: 'reminders',
    title: 'Reminders',
    desc: 'Organize and keep on top of all your reminders.',
    icon: Clock,
    color: 'bg-orange-500'
  }
];

const AddCardsPanel: React.FC<AddCardsPanelProps> = ({ isOpen, onClose, onAddCard, onRemoveCard, addedCardTypes }) => {
  const { showToast } = useToast();

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800">Add Cards</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 custom-scrollbar">
        {CARDS.map((card) => {
          const isAdded = addedCardTypes.includes(card.id);

          return (
            <div key={card.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center text-white shadow-md`}>
                  <card.icon size={20} />
                </div>
                <button
                  className={`flex items-center space-x-1.5 border text-[10px] font-bold px-3 py-1.5 rounded-md transition-all active:scale-95 ${isAdded
                      ? 'bg-green-50 border-green-200 text-green-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-brand-primary hover:border-brand-primary'
                    }`}
                  onClick={() => {
                    if (isAdded) {
                      onRemoveCard(card.id);
                      showToast(`Removed ${card.title} from Home`, 'info');
                    } else {
                      onAddCard({ id: card.id, title: card.title, color: card.color });
                      showToast(`Added ${card.title} to Home`, 'success');
                    }
                  }}
                >
                  {isAdded ? (
                    <>
                      <span className="group-hover:hidden flex items-center space-x-1">
                        <span>ADDED</span>
                      </span>
                      <span className="hidden group-hover:flex items-center space-x-1">
                        <span>REMOVE</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus size={12} />
                      <span>ADD</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-brand-primary transition-colors">{card.title}</h3>
                {card.isNew && (
                  <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shadow-sm">New</span>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddCardsPanel;