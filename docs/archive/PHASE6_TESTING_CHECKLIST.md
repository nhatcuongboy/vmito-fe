# Phase 6: Integration & Testing Checklist

## 📋 Testing Status

### API Testing

#### Tournament CRUD

- [ ] **Create tournament** - POST /api/tournaments
  - [ ] Valid tournament creation with all fields
  - [ ] Validation: name, startDate, endDate required
  - [ ] Validation: at least one category required
  - [ ] Validation: endDate must be after startDate
  - [ ] Authorization: Only HOST can create
  - [ ] Creates categories, umpires, scoring devices, courts

- [ ] **Get all tournaments** - GET /api/tournaments
  - [ ] Returns all tournaments (public)
  - [ ] Includes host, \_count fields

- [ ] **Get tournament by ID** - GET /api/tournaments/:id
  - [ ] Returns tournament with all relations (public)
  - [ ] Returns 404 if not found

- [ ] **Update tournament** - PUT /api/tournaments/:id
  - [ ] Only HOST can update
  - [ ] Only tournament host can update their tournament
  - [ ] Validates date ranges
  - [ ] Updates name, dates, status

- [ ] **Delete tournament** - DELETE /api/tournaments/:id
  - [ ] Only HOST can delete
  - [ ] Only tournament host can delete their tournament
  - [ ] Cascades delete to related data

#### Category Management

- [ ] **Get categories** - GET /api/tournaments/:id/categories
- [ ] **Create category** - POST /api/tournaments/:id/categories
- [ ] **Get category** - GET /api/categories/:id
- [ ] **Update category** - PUT /api/categories/:id
- [ ] **Delete category** - DELETE /api/categories/:id

#### Category Registration

- [ ] **Get registrations** - GET /api/categories/:id/registrations
- [ ] **Create registration** - POST /api/categories/:id/registrations
  - [ ] Single category: register player
  - [ ] Double category: register pair
- [ ] **Delete registration** - DELETE /api/categories/:id/registrations/:registrationId

#### Category Matches

- [ ] **Get matches** - GET /api/categories/:id/matches
- [ ] **Create match** - POST /api/categories/:id/matches
- [ ] **Get match** - GET /api/category-matches/:id
- [ ] **Update match** - PUT /api/category-matches/:id
- [ ] **Delete match** - DELETE /api/category-matches/:id
- [ ] **Start match** - POST /api/category-matches/:id/start
- [ ] **End match** - POST /api/category-matches/:id/end
  - [ ] Updates standings automatically
  - [ ] Validates score format

#### Standings

- [ ] **Get group standings** - GET /api/categories/:id/groups/:groupId/standings
- [ ] **Get all standings** - GET /api/categories/:id/standings
- [ ] **Calculate standings** - POST /api/categories/:id/groups/:groupId/calculate-standings
- [ ] **Get group winners** - GET /api/categories/:id/groups/:groupId/winners

#### Tournament Players

- [ ] **Get players** - GET /api/tournaments/:id/players
- [ ] **Create player** - POST /api/tournaments/:id/players
- [ ] **Get player** - GET /api/tournament-players/:id
- [ ] **Update player** - PUT /api/tournament-players/:id
- [ ] **Delete player** - DELETE /api/tournament-players/:id

#### Tournament Pairs

- [ ] **Get pairs** - GET /api/tournaments/:id/pairs
- [ ] **Create pair** - POST /api/tournaments/:id/pairs
- [ ] **Get pair** - GET /api/tournament-pairs/:id
- [ ] **Update pair** - PUT /api/tournament-pairs/:id
- [ ] **Delete pair** - DELETE /api/tournament-pairs/:id

#### Tournament Resources (Umpires, Scoring Devices, Courts)

- [ ] **Get umpires** - GET /api/tournaments/:id/umpires
- [ ] **Add umpire** - POST /api/tournaments/:id/umpires
- [ ] **Update umpire** - PUT /api/tournament-umpires/:id
- [ ] **Delete umpire** - DELETE /api/tournament-umpires/:id
- [ ] **Get scoring devices** - GET /api/tournaments/:id/scoring-devices
- [ ] **Add scoring device** - POST /api/tournaments/:id/scoring-devices
- [ ] **Update scoring device** - PUT /api/tournament-scoring-devices/:id
- [ ] **Delete scoring device** - DELETE /api/tournament-scoring-devices/:id
- [ ] **Get courts** - GET /api/tournaments/:id/courts
- [ ] **Add court** - POST /api/tournaments/:id/courts
- [ ] **Update court** - PUT /api/tournament-courts/:id
- [ ] **Delete court** - DELETE /api/tournament-courts/:id

### Authorization Testing

- [ ] **Public access**
  - [ ] Public users can view tournament list
  - [ ] Public users can view tournament details
  - [ ] Public users can view category details
  - [ ] Public users CANNOT create tournaments
  - [ ] Public users CANNOT manage tournaments

- [ ] **HOST access**
  - [ ] HOST can create tournaments
  - [ ] HOST can manage their own tournaments
  - [ ] HOST can create/update/delete categories
  - [ ] HOST can manage players/pairs
  - [ ] HOST can manage matches
  - [ ] HOST CANNOT manage other HOST's tournaments

- [ ] **PLAYER access**
  - [ ] PLAYER can view tournaments (public)
  - [ ] PLAYER CANNOT create tournaments
  - [ ] PLAYER CANNOT manage tournaments

### UI Testing

#### Tournament List Page (`/tournaments`)

- [ ] Displays all tournaments correctly
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Tournament cards show correct information
- [ ] "Create Tournament" button visible and works
- [ ] Clicking tournament card navigates to detail page
- [ ] Loading state displays correctly
- [ ] Empty state displays when no tournaments

#### Tournament Detail Page (`/tournaments/:id`)

- [ ] Displays tournament information correctly
- [ ] Shows all categories
- [ ] Shows host information
- [ ] Shows status badge with correct color
- [ ] "Manage" button visible for HOST
- [ ] Clicking category navigates to category page
- [ ] Loading state displays correctly
- [ ] Error handling for non-existent tournament

#### Create Tournament Page (`/tournaments/new`)

- [ ] Form validation works
  - [ ] Name required
  - [ ] Start date required
  - [ ] End date required
  - [ ] End date must be after start date
  - [ ] At least one category required
- [ ] Can add/remove categories
- [ ] Can add/remove umpires
- [ ] Can add/remove scoring devices
- [ ] Can add/remove courts
- [ ] Submit creates tournament successfully
- [ ] Redirects to manage page after creation
- [ ] Error messages display correctly
- [ ] Loading state during submission

#### Tournament Management Page (`/tournaments/:id/manage`)

- [ ] Tabs display correctly
- [ ] Categories tab shows all categories
- [ ] Players tab shows all players
- [ ] Pairs tab shows all pairs
- [ ] Can navigate between tabs
- [ ] "Add Category" button works
- [ ] "Add Player" button works
- [ ] "Add Pair" button works
- [ ] Loading states work correctly

#### Category Management Page (`/tournaments/:id/manage/categories/:categoryId`)

- [ ] Displays category information
- [ ] Settings tab works
  - [ ] Can update hasGroupStage
  - [ ] Can update match format
  - [ ] Can update group settings
- [ ] Registrations tab works
  - [ ] Shows registered players/pairs
  - [ ] Can add registration
  - [ ] Can remove registration
- [ ] Matches tab works
  - [ ] Shows all matches
  - [ ] Can create match
  - [ ] Can start match
  - [ ] Can end match
  - [ ] Can delete match
- [ ] Standings tab works
  - [ ] Shows group standings
  - [ ] Standings update after match ends
  - [ ] Winners highlighted correctly
  - [ ] Can recalculate standings

#### Player Management Page (`/tournaments/:id/manage/players`)

- [ ] Displays all players
- [ ] Search functionality works
- [ ] Can create player
- [ ] Can edit player
- [ ] Can delete player
- [ ] Form validation works
- [ ] Loading states work

#### Pair Management Page (`/tournaments/:id/manage/pairs`)

- [ ] Displays all pairs
- [ ] Can create pair
- [ ] Can edit pair
- [ ] Can delete pair
- [ ] Pair creation requires 2 players
- [ ] Form validation works

### Bug Fixes

#### Known Issues to Fix

- [ ] Check for TypeScript errors
- [ ] Check for runtime errors
- [ ] Check for console warnings
- [ ] Fix any navigation issues
- [ ] Fix any form validation issues
- [ ] Fix any authorization issues
- [ ] Fix any data loading issues
- [ ] Fix any UI/UX issues

### Performance Testing

- [ ] Tournament list loads quickly
- [ ] Tournament detail page loads quickly
- [ ] Category management page loads quickly
- [ ] Standings calculation is performant
- [ ] No memory leaks
- [ ] Proper error boundaries

### Edge Cases

- [ ] Empty tournament (no categories)
- [ ] Tournament with no players
- [ ] Tournament with no pairs
- [ ] Category with no registrations
- [ ] Category with no matches
- [ ] Match with no score
- [ ] Group with no participants
- [ ] Very large tournaments (many categories/players)

## 🐛 Bug Report Template

When finding bugs, document them here:

### Bug #1: [Title]

- **Location**: [File/Page]
- **Description**: [What happens]
- **Expected**: [What should happen]
- **Steps to reproduce**:
  1.
  2.
  3.
- **Status**: [ ] Open [ ] Fixed [ ] Won't Fix

---

## ✅ Completion Criteria

Phase 6 is complete when:

- [ ] All API endpoints tested and working
- [ ] All UI flows tested and working
- [ ] Authorization properly enforced
- [ ] All critical bugs fixed
- [ ] No TypeScript errors
- [ ] No console errors in production build
- [ ] Documentation updated
