# Requirements Document

## Introduction

This feature adds a new "Tất cả" (All) tab to the "Kèo tham gia" (Joined Sessions) page at `host/sessions/joined`. The new tab will display all sessions that the current user has joined, regardless of their status (PREPARING, IN_PROGRESS, FINISHED, CANCELLED). This provides users with a comprehensive view of their session participation history.

## Glossary

- **Joined_Sessions_Page**: The page at `host/sessions/joined` that displays sessions the current user has joined
- **Status_Tab_Switch**: The tab navigation component that allows switching between different session views (Active, Ended, All)
- **Session_Status**: The current state of a session (PREPARING, IN_PROGRESS, FINISHED, CANCELLED)
- **Session_List**: The list component that displays session cards with filtering and sorting capabilities
- **API_Service**: The PlayerService that fetches joined session data from the backend
- **UI_Component**: Visual elements that must render correctly on both desktop and mobile devices

## Requirements

### Requirement 1: Add "Tất cả" Tab to Joined Sessions Page

**User Story:** As a user, I want to see a "Tất cả" (All) tab on the Joined Sessions page, so that I can view all sessions I have joined regardless of their status.

#### Acceptance Criteria

1. WHEN the Joined Sessions page loads, THE Status_Tab_Switch SHALL display three tabs: "Đang hoạt động" (Active), "Đã kết thúc" (Ended), and "Tất cả" (All)
2. THE "Tất cả" tab SHALL be positioned to the right of the "Đã kết thúc" tab
3. WHEN a user clicks the "Tất cả" tab, THE Session_List SHALL display all joined sessions regardless of Session_Status
4. THE tab order SHALL be: Active, Ended, All (left to right)

### Requirement 2: Display All Sessions in "Tất cả" Tab

**User Story:** As a user, I want to see all my joined sessions when I select the "Tất cả" tab, so that I can review my complete participation history.

#### Acceptance Criteria

1. WHEN the "Tất cả" tab is active, THE API_Service SHALL fetch sessions without status filtering
2. THE Session_List SHALL display sessions with all Session_Status values (PREPARING, IN_PROGRESS, FINISHED, CANCELLED)
3. THE sessions SHALL be sorted by date in ascending order by default (nearest first)
4. THE Session_List SHALL support all existing sort options (date, created, price, distance, slots)
5. THE Session_List SHALL support infinite scroll pagination with 12 sessions per page

### Requirement 3: Maintain URL State for Tab Selection

**User Story:** As a user, I want the selected tab to be reflected in the URL, so that I can bookmark or share specific tab views.

#### Acceptance Criteria

1. WHEN a user selects the "Tất cả" tab, THE browser URL SHALL update to include `?tab=all`
2. WHEN a user navigates to the page with `?tab=all` in the URL, THE "Tất cả" tab SHALL be active by default
3. WHEN no tab parameter is present in the URL, THE "Đang hoạt động" (Active) tab SHALL be active by default
4. THE URL parameter SHALL persist when the user refreshes the page

### Requirement 4: Apply Filters to "Tất cả" Tab

**User Story:** As a user, I want to filter and search sessions in the "Tất cả" tab, so that I can find specific sessions more easily.

#### Acceptance Criteria

1. WHEN the "Tất cả" tab is active, THE Session_Filters SHALL display search, date, and status filter options
2. WHEN a user applies a status filter, THE Session_List SHALL display only sessions matching the selected Session_Status
3. WHEN a user applies a date filter, THE Session_List SHALL display only sessions matching the selected date
4. WHEN a user enters a search query, THE Session_List SHALL display only sessions matching the search term
5. THE filters SHALL work in combination (search + date + status)

### Requirement 5: Responsive UI for Desktop and Mobile

**User Story:** As a user, I want the "Tất cả" tab to display correctly on both desktop and mobile devices, so that I can access my sessions from any device.

#### Acceptance Criteria

1. WHEN viewing on desktop (width >= 768px), THE Status_Tab_Switch SHALL display tabs in pill style with rounded backgrounds
2. WHEN viewing on mobile (width < 768px), THE Status_Tab_Switch SHALL display tabs in underline style
3. THE active tab SHALL be visually distinct with appropriate styling (background color on desktop, underline on mobile)
4. THE Session_List SHALL display in grid layout on desktop (2-3 columns) and single column on mobile
5. THE UI_Component SHALL maintain proper spacing and alignment on both desktop and mobile viewports

### Requirement 6: Preserve Existing Tab Functionality

**User Story:** As a user, I want the existing "Đang hoạt động" and "Đã kết thúc" tabs to continue working as before, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN the "Đang hoạt động" tab is active, THE Session_List SHALL display only sessions with status PREPARING or IN_PROGRESS
2. WHEN the "Đã kết thúc" tab is active, THE Session_List SHALL display only sessions with status FINISHED
3. THE existing filter, sort, and pagination behavior SHALL remain unchanged for Active and Ended tabs
4. THE existing view mode toggle (grid/list) SHALL work correctly on all tabs
5. THE existing infinite scroll functionality SHALL work correctly on all tabs

### Requirement 7: Display Session Count for "Tất cả" Tab

**User Story:** As a user, I want to see the total count of sessions in the "Tất cả" tab, so that I know how many sessions I have joined in total.

#### Acceptance Criteria

1. WHEN the "Tất cả" tab is active, THE Results_Header SHALL display the total count of all joined sessions
2. THE count SHALL update when filters are applied
3. THE count SHALL match the total number of sessions returned by the API_Service
4. THE count display format SHALL be consistent with other tabs

### Requirement 8: Handle Loading and Error States

**User Story:** As a user, I want to see appropriate feedback when sessions are loading or if an error occurs, so that I understand the system state.

#### Acceptance Criteria

1. WHEN the "Tất cả" tab is loading initial data, THE Session_List SHALL display skeleton loading cards
2. WHEN the "Tất cả" tab is loading more data via infinite scroll, THE Session_List SHALL display a loading spinner at the bottom
3. IF the API_Service fails to fetch sessions, THE system SHALL log the error to the console
4. WHEN no sessions match the current filters, THE Session_List SHALL display an empty state message
