# Project Tree

## Root
- `App.tsx`: Main application component handling routing and global layout.
- `constants.ts`: Global constants and mock data.
- `index.html`: Entry point HTML.
- `index.tsx`: Entry point React file.
- `vite.config.ts`: Vite configuration.
- `tsconfig.json`: TypeScript configuration.
- `package.json`: Project dependencies and scripts.

## Directories

### `layout/`
Contains global layout components.
- `Sidebar.tsx`: Main navigation sidebar.
- `Header.tsx`: Top header for standard pages.
- `TopBar.tsx`: Global top bar with user profile and search.
- `DepartmentHeader.tsx`: Specialized header for department pages.
- `LandingPage.tsx`: Public landing page.
- `LoginPage.tsx`: Authentication page.

### `ui/`
Contains reusable UI components.
- `Toast.tsx`: Toast notification system.
- `BrainModal.tsx`: AI assistant modal.
- `AddCardsPanel.tsx`: Panel for adding widgets to Home.
- `TableBuilder.tsx`: UI for building custom tables.
- `CustomTable.tsx`: Reusable table component.
- `KPICard.tsx`: KPI widget component.
- `ChartWidget.tsx`: Chart widget component.

### `features/`
Contains feature-specific logic, components, and pages.
- `home/`: Home dashboard feature.
- `inbox/`: Messaging and notification feature.
- `tasks/`: Task management feature (List, Board, Calendar views).
- `space/`: Space management and 3D visualization.
- `dashboards/`: General dashboarding (Goals, Overview).
- `marketplace/`: Marketplace feature.
- `mind-map/`: Mind mapping feature.
- `ocean/`: Deep work / focus mode feature.
- `operations/`: Operations department features.
- `business/`: Business department features.
- `support/`: Support department features.
- `supply-chain/`: Supply chain department features.

### `contexts/`
Contains React Contexts for global state management.
- `NavigationContext.tsx`: Handles navigation state (active page, view type).
- `UIContext.tsx`: Handles global UI state (modals, panels).

### `services/`
Contains API and service layers.
- `auth.ts`: Authentication service.
- `geminiService.ts`: AI service integration.

### `types/`
Contains TypeScript type definitions.
- `shared.ts`: Shared types used across multiple features.

### `utils/`
Contains utility functions.
- `projectDownloader.ts`: Utility for downloading project source.
