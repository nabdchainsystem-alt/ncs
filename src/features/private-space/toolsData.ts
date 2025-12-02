import {
    Layout, StickyNote, BrainCircuit, GitMerge, Network, PenTool,
    Kanban, CheckSquare, Calendar, Flag, ListTodo, ClipboardList,
    Target, TrendingUp, PieChart, Users, Search, Zap, Database,
    FileText, Image, MessageSquare, Activity, Code, Settings,
    Box, Layers, Shield, Clock, BookOpen, Video, Mic, Smile,
    Terminal, Server, Wrench, BarChart, Table, Map
} from 'lucide-react';

export interface ToolItem {
    id: string;
    name: string;
    icon: any;
    description: string;
    isAdvanced?: boolean;
}

export interface ToolCategory {
    id: string;
    name: string;
    icon: any;
    items: ToolItem[];
}

export const TOOLS_DATA: ToolCategory[] = [
    {
        id: 'collaboration',
        name: 'Collaboration & Creativity',
        icon: Users,
        items: [
            // Basic
            { id: 'whiteboard', name: 'Whiteboard', icon: Layout, description: 'Freeform canvas for ideas', isAdvanced: false },
            { id: 'sticky-notes', name: 'Sticky Notes', icon: StickyNote, description: 'Quick thoughts and reminders', isAdvanced: false },
            { id: 'mind-map', name: 'Mind Map', icon: BrainCircuit, description: 'Visual brainstorming', isAdvanced: false },
            { id: 'flowchart', name: 'Flowchart', icon: GitMerge, description: 'Process mapping', isAdvanced: false },
            { id: 'brainstorm', name: 'Brainstorm Canvas', icon: Zap, description: 'Group ideation space', isAdvanced: false },
            { id: 'org-chart', name: 'Org Chart', icon: Network, description: 'Team structure visualization', isAdvanced: false },
            { id: 'idea-wall', name: 'Idea Wall', icon: Layout, description: 'Collect and vote on ideas', isAdvanced: false },
            { id: 'sketch-pad', name: 'Sketch Pad', icon: PenTool, description: 'Freehand drawing', isAdvanced: false },
            // Advanced
            { id: 'multiplayer-canvas', name: 'Real-time Multiplayer', icon: Users, description: 'Live collaboration', isAdvanced: true },
            { id: 'infinite-canvas', name: 'Infinite Canvas', icon: Layout, description: 'Unlimited space', isAdvanced: true },
            { id: 'wireframe', name: 'Wireframe Builder', icon: Box, description: 'UI/UX mockups', isAdvanced: true },
            { id: 'concept-map', name: 'Concept Map', icon: Network, description: 'Connect complex ideas', isAdvanced: true },
            { id: 'workshops', name: 'Workshops Templates', icon: Presentation, description: 'Guided sessions', isAdvanced: true },
            { id: 'mapping-templates', name: 'Mapping Templates', icon: Map, description: 'Strategic maps', isAdvanced: true },
            { id: 'use-case', name: 'Use Case Diagrammer', icon: GitMerge, description: 'System interactions', isAdvanced: true },
            { id: 'collab-cursor', name: 'Collaborative Cursor', icon: MousePointer2, description: 'See who is where', isAdvanced: true },
        ]
    },
    {
        id: 'project-management',
        name: 'Project Planning & Management',
        icon: Kanban,
        items: [
            // Basic
            { id: 'kanban', name: 'Kanban Board', icon: Kanban, description: 'Visual workflow management', isAdvanced: false },
            { id: 'todo', name: 'To-Do List', icon: CheckSquare, description: 'Simple task tracking', isAdvanced: false },
            { id: 'gantt', name: 'Gantt Chart', icon: Calendar, description: 'Timeline view', isAdvanced: false },
            { id: 'roadmap', name: 'Roadmap Builder', icon: Flag, description: 'Strategic planning', isAdvanced: false },
            { id: 'calendar-timeline', name: 'Calendar Timeline', icon: Calendar, description: 'Schedule view', isAdvanced: false },
            { id: 'milestone', name: 'Milestone Tracker', icon: Target, description: 'Key achievements', isAdvanced: false },
            { id: 'checklists', name: 'Checklists', icon: ListTodo, description: 'Step-by-step guides', isAdvanced: false },
            { id: 'meeting-notes', name: 'Meeting Notes Panel', icon: ClipboardList, description: 'Record discussions', isAdvanced: false },
            // Advanced
            { id: 'sprint-planner', name: 'Sprint Planner', icon: RotateCw, description: 'Agile cycle planning', isAdvanced: true },
            { id: 'backlog', name: 'Backlog Organizer', icon: List, description: 'Prioritize tasks', isAdvanced: true },
            { id: 'portfolio', name: 'Project Portfolio', icon: Briefcase, description: 'Multi-project view', isAdvanced: true },
            { id: 'risk-register', name: 'Risk Register', icon: ShieldAlert, description: 'Track potential issues', isAdvanced: true },
            { id: 'raid-log', name: 'RAID Log', icon: FileWarning, description: 'Risks, Assumptions, Issues, Dependencies', isAdvanced: true },
            { id: 'raci', name: 'RACI Matrix', icon: Users, description: 'Roles and responsibilities', isAdvanced: true },
            { id: 'dependency', name: 'Dependency Mapping', icon: Link, description: 'Task relationships', isAdvanced: true },
            { id: 'critical-path', name: 'Critical Path', icon: GitCommit, description: 'Optimize timelines', isAdvanced: true },
        ]
    },
    {
        id: 'strategy',
        name: 'Strategy & Business',
        icon: TrendingUp,
        items: [
            // Basic
            { id: 'swot', name: 'SWOT Analysis', icon: Target, description: 'Strengths, Weaknesses, Opportunities, Threats', isAdvanced: false },
            { id: 'pestel', name: 'PESTEL Analysis', icon: Globe, description: 'Macro-environmental factors', isAdvanced: false },
            { id: 'business-model', name: 'Business Model Canvas', icon: Layout, description: 'Strategic management template', isAdvanced: false },
            { id: 'value-prop', name: 'Value Proposition', icon: Heart, description: 'Customer value map', isAdvanced: false },
            { id: 'positioning', name: 'Product Positioning', icon: Crosshair, description: 'Market placement', isAdvanced: false },
            { id: 'competitor', name: 'Competitor Matrix', icon: Swords, description: 'Market comparison', isAdvanced: false },
            { id: 'pricing', name: 'Pricing Strategy', icon: DollarSign, description: 'Cost and value analysis', isAdvanced: false },
            // Advanced
            { id: 'porters', name: 'Porter’s Five Forces', icon: Shield, description: 'Industry analysis', isAdvanced: true },
            { id: 'growth-matrix', name: 'Growth Matrix', icon: TrendingUp, description: 'Ansoff matrix', isAdvanced: true },
            { id: 'strategic-roadmap', name: 'Strategic Roadmap', icon: Map, description: 'Long-term vision', isAdvanced: true },
            { id: 'okr', name: 'OKR Planner', icon: Target, description: 'Objectives and Key Results', isAdvanced: true },
            { id: 'kpi', name: 'KPI Scoreboard', icon: BarChart, description: 'Performance metrics', isAdvanced: true },
            { id: 'blueprint', name: 'Company Blueprint', icon: FileText, description: 'Organizational design', isAdvanced: true },
            { id: 'org-sim', name: 'Org Structure Sim', icon: Users, description: 'Team modeling', isAdvanced: true },
            { id: 'market-map', name: 'Market Landscape', icon: Globe, description: 'Ecosystem view', isAdvanced: true },
            { id: 'benchmark', name: 'Benchmark Dashboard', icon: BarChart2, description: 'Performance comparison', isAdvanced: true },
        ]
    },
    {
        id: 'product-ux',
        name: 'Product & UX',
        icon: Box,
        items: [
            // Basic
            { id: 'persona', name: 'User Persona', icon: User, description: 'Target audience profiles', isAdvanced: false },
            { id: 'journey-map', name: 'User Journey Map', icon: Map, description: 'Customer experience path', isAdvanced: false },
            { id: 'empathy', name: 'Empathy Map', icon: Heart, description: 'User feelings and thoughts', isAdvanced: false },
            { id: 'feature-list', name: 'Feature List', icon: List, description: 'Product capabilities', isAdvanced: false },
            { id: 'prd', name: 'PRD Builder', icon: FileText, description: 'Requirements document', isAdvanced: false },
            // Advanced
            { id: 'ux-flow', name: 'UX Flow Builder', icon: GitMerge, description: 'Interaction design', isAdvanced: true },
            { id: 'experiment', name: 'Experiment Board', icon: FlaskConical, description: 'Hypothesis testing', isAdvanced: true },
            { id: 'usability', name: 'Usability Testing', icon: CheckCircle, description: 'User feedback', isAdvanced: true },
            { id: 'heatmap', name: 'Heatmap Simulator', icon: Activity, description: 'User engagement', isAdvanced: true },
            { id: 'ab-test', name: 'A/B Test Planner', icon: Split, description: 'Variant comparison', isAdvanced: true },
            { id: 'rice', name: 'Prioritization (RICE)', icon: Calculator, description: 'Feature ranking', isAdvanced: true },
            { id: 'lifecycle', name: 'Product Lifecycle', icon: RotateCw, description: 'Development stages', isAdvanced: true },
            { id: 'pain-gain', name: 'Pain/Gain Map', icon: Smile, description: 'User value analysis', isAdvanced: true },
            { id: 'blueprint-exp', name: 'Experience Blueprint', icon: Layers, description: 'Service design', isAdvanced: true },
        ]
    },
    {
        id: 'ai-automation',
        name: 'AI & Automation',
        icon: BrainCircuit,
        items: [
            // Basic
            { id: 'ai-writer', name: 'AI Writing Assistant', icon: PenTool, description: 'Content generation', isAdvanced: false },
            { id: 'ai-brainstorm', name: 'AI Brainstorming', icon: Lightbulb, description: 'Idea generation', isAdvanced: false },
            { id: 'ai-summarizer', name: 'AI Summarizer', icon: FileText, description: 'Content condensation', isAdvanced: false },
            { id: 'chatbot', name: 'Chatbot Builder', icon: MessageSquare, description: 'Conversational flows', isAdvanced: false },
            { id: 'translate', name: 'Auto-Translate', icon: Languages, description: 'Multi-language support', isAdvanced: false },
            // Advanced
            { id: 'ai-agent', name: 'AI Agent Playground', icon: Bot, description: 'Autonomous agents', isAdvanced: true },
            { id: 'workflow', name: 'Workflow Automation', icon: GitMerge, description: 'Process automation', isAdvanced: true },
            { id: 'zapier', name: 'Integration Hub', icon: Link, description: 'Connect apps', isAdvanced: true },
            { id: 'api-composer', name: 'API Visual Composer', icon: Code, description: 'Endpoint design', isAdvanced: true },
            { id: 'webhook', name: 'Webhook Builder', icon: Webhook, description: 'Event triggers', isAdvanced: true },
            { id: 'dataset', name: 'Dataset Manager', icon: Database, description: 'Data organization', isAdvanced: true },
            { id: 'prompt-studio', name: 'Prompt Templates', icon: Terminal, description: 'AI instruction sets', isAdvanced: true },
            { id: 'auto-class', name: 'Auto-Classification', icon: Tag, description: 'Smart sorting', isAdvanced: true },
            { id: 'intent', name: 'Intent Detection', icon: Search, description: 'User goal analysis', isAdvanced: true },
            { id: 'model-play', name: 'Model Playground', icon: Cpu, description: 'Test AI models', isAdvanced: true },
        ]
    },
    {
        id: 'data-analytics',
        name: 'Data & Analytics',
        icon: BarChart,
        items: [
            // Basic
            { id: 'chart-builder', name: 'Chart Builder', icon: PieChart, description: 'Visual data representation', isAdvanced: false },
            { id: 'dashboard-builder', name: 'Dashboard Builder', icon: LayoutDashboard, description: 'KPI monitoring', isAdvanced: false },
            { id: 'table-explorer', name: 'Table Explorer', icon: Table, description: 'Data grid view', isAdvanced: false },
            { id: 'import-export', name: 'Import/Export Tool', icon: ArrowLeftRight, description: 'Data migration', isAdvanced: false },
            { id: 'filters', name: 'Filters & Sorting', icon: Filter, description: 'Data refinement', isAdvanced: false },
            // Advanced
            { id: 'sql', name: 'SQL Query Builder', icon: Database, description: 'Custom queries', isAdvanced: true },
            { id: 'aggregation', name: 'Data Aggregation', icon: Layers, description: 'Combine data sources', isAdvanced: true },
            { id: 'scenario', name: 'Scenario Simulator', icon: PlayCircle, description: 'What-if analysis', isAdvanced: true },
            { id: 'forecasting', name: 'Forecasting Sandbox', icon: TrendingUp, description: 'Predictive analytics', isAdvanced: true },
            { id: 'cohort', name: 'Cohort Analysis', icon: Users, description: 'User grouping', isAdvanced: true },
            { id: 'funnel', name: 'Funnel Analysis', icon: Filter, description: 'Conversion tracking', isAdvanced: true },
            { id: 'monitoring', name: 'Alerts & Monitoring', icon: Bell, description: 'System health', isAdvanced: true },
            { id: 'csv', name: 'CSV Transformer', icon: FileSpreadsheet, description: 'Data formatting', isAdvanced: true },
        ]
    },
    {
        id: 'operations',
        name: 'Operations & Processes',
        icon: Settings,
        items: [
            // Basic
            { id: 'sop', name: 'SOP Builder', icon: FileText, description: 'Standard Operating Procedures', isAdvanced: false },
            { id: 'checklist', name: 'Process Checklist', icon: CheckSquare, description: 'Execution steps', isAdvanced: false },
            { id: 'audit', name: 'Audit Sheet', icon: ClipboardCheck, description: 'Compliance tracking', isAdvanced: false },
            { id: 'task-templates', name: 'Task Templates', icon: Copy, description: 'Reusable tasks', isAdvanced: false },
            // Advanced
            { id: 'process-flow', name: 'Process Flow Designer', icon: GitMerge, description: 'Workflow mapping', isAdvanced: true },
            { id: 'incident', name: 'Incident Tracker', icon: AlertTriangle, description: 'Issue resolution', isAdvanced: true },
            { id: 'shift', name: 'Shift Scheduler', icon: Clock, description: 'Staff management', isAdvanced: true },
            { id: 'inventory', name: 'Inventory Tracker', icon: Box, description: 'Stock management', isAdvanced: true },
            { id: 'resource', name: 'Resource Allocation', icon: Users, description: 'Capacity planning', isAdvanced: true },
            { id: 'time-block', name: 'Time Blocking', icon: Calendar, description: 'Schedule optimization', isAdvanced: true },
            { id: 'sla', name: 'SLA Tracker', icon: Timer, description: 'Service Level Agreements', isAdvanced: true },
            { id: 'governance', name: 'Governance Console', icon: Shield, description: 'Policy management', isAdvanced: true },
        ]
    },
    {
        id: 'documentation',
        name: 'Documentation',
        icon: BookOpen,
        items: [
            // Basic
            { id: 'doc-editor', name: 'Document Editor', icon: FileText, description: 'Rich text editing', isAdvanced: false },
            { id: 'wiki', name: 'Wiki Pages', icon: Book, description: 'Knowledge base', isAdvanced: false },
            { id: 'notes', name: 'Notes', icon: StickyNote, description: 'Quick capture', isAdvanced: false },
            { id: 'minutes', name: 'Meeting Minutes', icon: Clipboard, description: 'Meeting records', isAdvanced: false },
            // Advanced
            { id: 'version-control', name: 'Version Control', icon: History, description: 'Change tracking', isAdvanced: true },
            { id: 'approval', name: 'Approval Workflow', icon: CheckCircle, description: 'Review process', isAdvanced: true },
            { id: 'doc-templates', name: 'Document Templates', icon: Copy, description: 'Standardized formats', isAdvanced: true },
            { id: 'collab-sections', name: 'Collaborative Sections', icon: Users, description: 'Joint editing', isAdvanced: true },
            { id: 'research', name: 'Research Organizer', icon: Search, description: 'Source management', isAdvanced: true },
            { id: 'citations', name: 'Auto Citations', icon: Quote, description: 'Reference generation', isAdvanced: true },
            { id: 'style-guide', name: 'Style Guide Manager', icon: Palette, description: 'Brand consistency', isAdvanced: true },
        ]
    },
    {
        id: 'creative',
        name: 'Creative & Visual',
        icon: Image,
        items: [
            // Basic
            { id: 'annotation', name: 'Image Annotation', icon: Edit3, description: 'Mark up visuals', isAdvanced: false },
            { id: 'drawing', name: 'Simple Drawing', icon: PenTool, description: 'Basic sketches', isAdvanced: false },
            { id: 'mood-board', name: 'Mood Board', icon: Layout, description: 'Visual inspiration', isAdvanced: false },
            { id: 'screenshot', name: 'Screenshot Editor', icon: Crop, description: 'Capture and edit', isAdvanced: false },
            // Advanced
            { id: 'brand-kit', name: 'Brand Kit', icon: Palette, description: 'Logo, colors, fonts', isAdvanced: true },
            { id: 'visual-lib', name: 'Visual Library', icon: Image, description: 'Asset management', isAdvanced: true },
            { id: 'photo-cleanup', name: 'Photo Cleanup', icon: Eraser, description: 'Image enhancement', isAdvanced: true },
            { id: 'presentation', name: 'Presentation Builder', icon: Monitor, description: 'Slide decks', isAdvanced: true },
            { id: 'storyboard', name: 'Slide Storyboard', icon: Film, description: 'Narrative planning', isAdvanced: true },
            { id: 'illustration', name: 'Idea Illustration', icon: PenTool, description: 'Custom graphics', isAdvanced: true },
            { id: 'diagrams', name: 'Diagram Templates', icon: Layout, description: 'Structured visuals', isAdvanced: true },
            { id: 'interactive', name: 'Interactive Charts', icon: PieChart, description: 'Dynamic data', isAdvanced: true },
        ]
    },
    {
        id: 'communication',
        name: 'Communication',
        icon: MessageSquare,
        items: [
            // Basic
            { id: 'chat', name: 'Chat', icon: MessageCircle, description: 'Instant messaging', isAdvanced: false },
            { id: 'voice', name: 'Voice Notes', icon: Mic, description: 'Audio messages', isAdvanced: false },
            { id: 'mentions', name: 'Mentions & Tags', icon: AtSign, description: 'Notifications', isAdvanced: false },
            { id: 'comments', name: 'Comments', icon: MessageSquare, description: 'Threaded discussions', isAdvanced: false },
            // Advanced
            { id: 'threads', name: 'Threaded Conversations', icon: List, description: 'Organized topics', isAdvanced: true },
            { id: 'scheduler', name: 'Meeting Scheduler', icon: Calendar, description: 'Time coordination', isAdvanced: true },
            { id: 'meeting-ai', name: 'Meeting AI Notes', icon: Bot, description: 'Auto-transcription', isAdvanced: true },
            { id: 'decisions', name: 'Decision Logging', icon: Gavel, description: 'Record outcomes', isAdvanced: true },
            { id: 'feed', name: 'Activity Feed', icon: Activity, description: 'Update stream', isAdvanced: true },
            { id: 'broadcast', name: 'Team Broadcasts', icon: Radio, description: 'Announcements', isAdvanced: true },
        ]
    },
    {
        id: 'productivity',
        name: 'Personal Productivity',
        icon: Smile,
        items: [
            // Basic
            { id: 'habit', name: 'Habit Tracker', icon: CheckCircle, description: 'Routine building', isAdvanced: false },
            { id: 'task-list', name: 'Tasks', icon: ListTodo, description: 'Personal todos', isAdvanced: false },
            { id: 'calendar-personal', name: 'Calendar', icon: Calendar, description: 'My schedule', isAdvanced: false },
            { id: 'notes-vault', name: 'Notes Vault', icon: Lock, description: 'Private notes', isAdvanced: false },
            { id: 'goals', name: 'Goals Board', icon: Target, description: 'Ambition tracking', isAdvanced: false },
            // Advanced
            { id: 'life-dash', name: 'Life Dashboard', icon: LayoutDashboard, description: 'Holistic view', isAdvanced: true },
            { id: 'vision', name: 'Vision Planner', icon: Eye, description: 'Long-term goals', isAdvanced: true },
            { id: 'mood', name: 'Mood Map', icon: Smile, description: 'Emotional tracking', isAdvanced: true },
            { id: 'journal', name: 'Daily Journal', icon: BookOpen, description: 'Reflection', isAdvanced: true },
            { id: 'finance', name: 'Finance Tracker', icon: DollarSign, description: 'Money management', isAdvanced: true },
            { id: 'budget', name: 'Budget Planner', icon: PieChart, description: 'Spending plan', isAdvanced: true },
            { id: 'learning', name: 'Learning Planner', icon: GraduationCap, description: 'Skill acquisition', isAdvanced: true },
            { id: 'crm-personal', name: 'Personal CRM', icon: Users, description: 'Relationship management', isAdvanced: true },
            { id: 'health', name: 'Health Tracker', icon: Heart, description: 'Wellness monitoring', isAdvanced: true },
        ]
    },
    {
        id: 'developer',
        name: 'Developer & Engineering',
        icon: Code,
        items: [
            // Basic
            { id: 'api-tester', name: 'API Tester', icon: Globe, description: 'Endpoint verification', isAdvanced: false },
            { id: 'snippets', name: 'Code Snippets', icon: Code, description: 'Reusable code', isAdvanced: false },
            { id: 'git-notes', name: 'Git Notes', icon: GitBranch, description: 'Version comments', isAdvanced: false },
            { id: 'release-notes', name: 'Release Notes', icon: FileText, description: 'Update logs', isAdvanced: false },
            { id: 'env-vars', name: 'Env Variables', icon: Lock, description: 'Config storage', isAdvanced: false },
            // Advanced
            { id: 'erd', name: 'ERD Designer', icon: Database, description: 'Database schema', isAdvanced: true },
            { id: 'sequence', name: 'Sequence Diagram', icon: GitMerge, description: 'Logic flow', isAdvanced: true },
            { id: 'arch-whiteboard', name: 'Architecture Board', icon: Layout, description: 'System design', isAdvanced: true },
            { id: 'logs', name: 'Logs Viewer', icon: FileText, description: 'System events', isAdvanced: true },
            { id: 'monitoring-dev', name: 'Monitoring Dash', icon: Activity, description: 'Performance metrics', isAdvanced: true },
            { id: 'errors', name: 'Error Tracker', icon: AlertOctagon, description: 'Bug logging', isAdvanced: true },
            { id: 'api-docs', name: 'API Docs Builder', icon: Book, description: 'Documentation', isAdvanced: true },
            { id: 'mock-server', name: 'Mock Server', icon: Server, description: 'API simulation', isAdvanced: true },
            { id: 'load-test', name: 'Load Test Tool', icon: Activity, description: 'Stress testing', isAdvanced: true },
            { id: 'devops', name: 'DevOps Checklist', icon: CheckSquare, description: 'Deployment steps', isAdvanced: true },
            { id: 'feature-flags', name: 'Feature Flags', icon: ToggleRight, description: 'Feature control', isAdvanced: true },
            { id: 'deployment', name: 'Deployment Tracker', icon: Rocket, description: 'Release history', isAdvanced: true },
            { id: 'schema', name: 'Schema Versions', icon: Database, description: 'Migration tracking', isAdvanced: true },
            { id: 'cicd', name: 'CI/CD Templates', icon: RefreshCw, description: 'Pipeline config', isAdvanced: true },
            { id: 'dep-map', name: 'Dependency Map', icon: Link, description: 'Library connections', isAdvanced: true },
        ]
    },
    {
        id: 'extra',
        name: 'Complementary Tools',
        icon: Wrench,
        items: [
            // General
            { id: 'heatmap-cal', name: 'Calendar Heatmap', icon: Calendar, description: 'Activity density', isAdvanced: false },
            { id: 'priority', name: 'Priority Matrix', icon: Grid, description: 'Urgency vs Importance', isAdvanced: false },
            { id: 'eisenhower', name: 'Eisenhower Box', icon: Square, description: 'Decision making', isAdvanced: false },
            { id: 'time-track', name: 'Time Tracker', icon: Clock, description: 'Duration logging', isAdvanced: false },
            { id: 'pomodoro', name: 'Pomodoro Timer', icon: Timer, description: 'Focus intervals', isAdvanced: false },
            { id: 'idea-rating', name: 'Idea Rating', icon: Star, description: 'Scoring system', isAdvanced: false },
            { id: 'agenda', name: 'Meeting Agenda', icon: List, description: 'Discussion points', isAdvanced: false },
            { id: 'notes-clean', name: 'Notes AI Cleaner', icon: Sparkles, description: 'Tidy up text', isAdvanced: false },
            { id: 'resolution', name: 'Comment Resolution', icon: CheckCircle, description: 'Close discussions', isAdvanced: false },
            { id: 'polls', name: 'Polls & Voting', icon: BarChart2, description: 'Group decisions', isAdvanced: false },
            { id: 'forms', name: 'Internal Forms', icon: FormInput, description: 'Data collection', isAdvanced: false },
            { id: 'surveys', name: 'Surveys', icon: ClipboardList, description: 'Feedback gathering', isAdvanced: false },
            { id: 'feedback', name: 'Feedback Wall', icon: MessageSquare, description: 'User comments', isAdvanced: false },
            { id: 'bug-report', name: 'Bug Reporter', icon: Bug, description: 'Issue submission', isAdvanced: false },
            { id: 'status', name: 'Status Page', icon: Activity, description: 'System uptime', isAdvanced: false },
            { id: 'roadblock', name: 'Roadblock Tracker', icon: AlertTriangle, description: 'Impediment log', isAdvanced: false },
            { id: 'customer-journey', name: 'Customer Journey', icon: Map, description: 'User path', isAdvanced: false },
            { id: 'deal-flow', name: 'Deal Flow Board', icon: DollarSign, description: 'Sales pipeline', isAdvanced: false },
            { id: 'crm', name: 'CRM Pipeline', icon: Users, description: 'Customer management', isAdvanced: false },
            { id: 'contracts', name: 'Contract Templates', icon: FileText, description: 'Legal agreements', isAdvanced: false },
            { id: 'approval-chain', name: 'Approval Chain', icon: GitMerge, description: 'Sign-off flow', isAdvanced: false },
            { id: 'org-roles', name: 'Team Org Roles', icon: Users, description: 'Responsibility map', isAdvanced: false },
            { id: 'permissions', name: 'Access Permissions', icon: Lock, description: 'Security settings', isAdvanced: false },
            { id: 'workspace-temp', name: 'Workspace Templates', icon: Layout, description: 'Setup presets', isAdvanced: false },
            { id: 'activity-view', name: 'Activity Viewer', icon: Eye, description: 'Usage logs', isAdvanced: false },
            { id: 'trash', name: 'Trash & Recovery', icon: Trash2, description: 'Deleted items', isAdvanced: false },
        ]
    }
];

// Import missing icons
import {
    Presentation, MousePointer2, RotateCw, Briefcase, ShieldAlert, FileWarning, Link, GitCommit,
    Globe, Heart, Crosshair, Swords, DollarSign, BarChart2, FlaskConical, Split, Calculator,
    Lightbulb, Languages, Bot, Webhook, Tag, Cpu, ArrowLeftRight, PlayCircle, Bell, FileSpreadsheet,
    ClipboardCheck, Copy, AlertTriangle, Timer, Book, History, Quote, Palette, Edit3, Crop, Eraser,
    Monitor, Film, MessageCircle, AtSign, Gavel, Radio, Eye, GraduationCap, GitBranch, AlertOctagon,
    ToggleRight, Rocket, RefreshCw, Grid, Square, Sparkles, FormInput, Bug, Trash2,
    Filter, List, User, CheckCircle, LayoutDashboard, Star
} from 'lucide-react';
