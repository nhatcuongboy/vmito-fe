Rating & Review System Implementation Plan
Requirements Summary
Player → Host Ratings: Players rate hosts (only, not sessions) after session ends. 1-5 stars + optional comment. One-time submission, no edits.
Host → Player Ratings: Hosts rate players who participated. 1-5 stars + optional comment. One-time submission, no edits.
Average Rating Display: Show average ratings for users across all their sessions as hosts and/or players.

1. Data Model Design
   New Types to Add in /src/lib/api/types.ts

export enum RatingType {
PLAYER_TO_HOST = 'PLAYER_TO_HOST',
HOST_TO_PLAYER = 'HOST_TO_PLAYER',
}

export interface Rating {
id: string;
sessionId: string;
raterUserId: string; // User giving rating
ratedUserId: string; // User receiving rating
type: RatingType; // Direction (player→host or host→player)
rating: number; // 1-5 stars
comment?: string; // Optional review (max 500 chars)
createdAt: Date;
updatedAt: Date;
rater?: { id: string; name: string; image?: string };
rated?: { id: string; name: string; image?: string };
}

export interface UserRatingStats {
userId: string;
averageRating: number; // Overall average
totalRatings: number; // Total count
asHostAverage?: number; // Average when acting as host
asHostCount?: number;
asPlayerAverage?: number; // Average when acting as player
asPlayerCount?: number;
}

export interface SessionRatingEligibility {
canRateHost: boolean;
hasRatedHost: boolean;
hostRating?: Rating;
canRatePlayers: string[]; // Player IDs host can rate
ratedPlayerIds: string[]; // Player IDs already rated by host
playerRatings: Rating[];
}

export interface CreateRatingRequest {
sessionId: string;
ratedUserId: string;
type: RatingType;
rating: number; // 1-5 required
comment?: string; // Max 500 chars
}
Update Existing Types
TransactionSummary: Add averageRating?: number and totalRatings?: number
HostTransactionSummary: Add averageRating?: number and totalRatings?: number
User: Add optional ratingStats?: UserRatingStats
ISession: Add optional ratingEligibility?: SessionRatingEligibility 2. API Endpoints (Backend)
Rating Endpoints
POST /ratings - Create a rating (player→host or host→player)
GET /ratings - Get ratings with filters (userId, sessionId, type, raterUserId, ratedUserId)
GET /ratings/session/:sessionId/eligibility - Check rating eligibility for current user
GET /ratings/user/:userId/stats - Get user's rating statistics
GET /ratings/user/:userId/received - Get ratings received by user
GET /ratings/user/:userId/given - Get ratings given by user
Eligibility Rules
Player → Host:

Session status must be FINISHED
User must be a player in the session (Player record with matching userId)
User must not have already rated the host for this session
Host → Player:

Session status must be FINISHED
Current user must be session.hostId
Player must have participated in the session
Host must not have already rated this player for this session 3. Frontend Service Layer
Create /src/lib/api/rating.service.ts
Implement service methods (following payment.service.ts pattern):

createRating(data: CreateRatingRequest): Promise<Rating>
getRatings(filters?: GetRatingsRequest): Promise<Rating[]>
getSessionRatingEligibility(sessionId: string): Promise<SessionRatingEligibility>
getUserRatingStats(userId: string): Promise<UserRatingStats>
getUserReceivedRatings(userId: string): Promise<Rating[]>
getUserGivenRatings(userId: string): Promise<Rating[]> 4. UI Components to Create
New Components in /src/components/rating/
StarRatingInput.tsx

Interactive 1-5 star selection
Props: value, onChange, size, disabled
Hover preview, visual feedback
StarRatingDisplay.tsx

Read-only star display with average (e.g., 4.3 ⭐)
Props: rating (decimal), count, size, showCount, variant
Used throughout app to show ratings
SubmitRatingModal.tsx

Main rating submission modal
Star input + comment textarea (max 500 chars)
Submit button (disabled until rating selected)
Loading/error states
Following CommonModal pattern from PlayerDetailModal.tsx
RatingList.tsx

Display list of ratings/reviews
Shows rater/rated info, stars, comment, timestamp
Props: ratings[], isLoading, showRater, showRated
UserRatingSummaryCard.tsx

Summary card with user's rating stats
Optional breakdown: as-host vs as-player 5. Integration Points
Session Pages (After Session Ends)
Player View - /src/app/[locale]/player/sessions/[id]/page.tsx

Fetch getSessionRatingEligibility(sessionId) if session is FINISHED
Show "Rate Host" button if canRateHost && !hasRatedHost
Show existing rating if already rated
Open SubmitRatingModal on button click
Host View - /src/app/[locale]/host/sessions/[id]/page.tsx

Fetch rating eligibility if session is FINISHED
In player list, show "Rate" button for each player in canRatePlayers
Show rating badge for already-rated players
Open SubmitRatingModal on button click with player info
Transaction Summary Pages
Player Transactions - /src/app/[locale]/player/transactions/page.tsx

Fetch host rating stats for each host in summary
Update TransactionSummaryList to display StarRatingDisplay next to each host
Show "(No ratings)" if totalRatings = 0
Host Transactions - /src/app/[locale]/host/transactions/page.tsx

Fetch player rating stats for each player in summary
Update TransactionSummaryList to display StarRatingDisplay next to each player
Show "(No ratings)" if totalRatings = 0
Player Detail Modal
File - /src/components/player/PlayerDetailModal.tsx

Fetch getUserRatingStats(player.userId) if userId exists
Display StarRatingDisplay in player info section
Add "View Reviews" collapsible section with RatingList of this player's ratings
Session Discovery (Find Sessions)
File - /src/components/session/FindSessionCard.tsx or /src/components/session/BaseSessionCard.tsx

Fetch host rating stats for session.hostId
Display StarRatingDisplay next to host name
Optional: Visual badge for highly-rated hosts (4.5+ rating) 6. Implementation Phases
Phase 1: Types & Service (1-2 days)
✅ Add all Rating\* types to types.ts
✅ Update TransactionSummary, User, ISession types
✅ Create rating.service.ts with all API methods
Test service methods once backend endpoints ready
Phase 2: Core Components (2-3 days)
Create StarRatingInput.tsx
Create StarRatingDisplay.tsx
Create SubmitRatingModal.tsx
Create RatingList.tsx
Create UserRatingSummaryCard.tsx
Add i18n translations for rating keys
Phase 3: Session Integration (1-2 days)
Update player session detail page - "Rate Host" button
Update host session detail page - "Rate Players" buttons
Implement eligibility checking logic
Test submission flow end-to-end
Phase 4: Transaction & Player Integration (1-2 days)
Update transaction summary data fetching
Modify TransactionSummaryList to show ratings
Update PlayerDetailModal with rating display
Test display in all locations
Phase 5: Session Discovery & Polish (1-2 days)
Add host rating to FindSessionCard
Add player ratings to relevant places
Loading states, error handling, empty states
Mobile responsiveness
Accessibility (keyboard nav, ARIA labels)
Phase 6: Testing (1 day)
Unit tests for service and components
Integration tests for rating submission
E2E tests for complete user flow
Performance optimization 7. Business Logic
Validation (Frontend)

- Rating must be 1-5
- Comment must be ≤ 500 characters
- Required field: rating
- Optional field: comment
  Duplicate Prevention
  Database constraint: unique(sessionId, raterUserId, ratedUserId, type)
  Frontend check: Show existing rating, disable submit button
  Average Calculation
  Formula: averageRating = SUM(rating) / COUNT(rating) where ratedUserId = :userId
  Display: Round to 1 decimal (e.g., 4.3)
  Show count: "4.3 ⭐ (12 ratings)"

8. i18n Translations to Add
   Add these keys to en.json, vi.json, cn.json:

rating.rateHost
rating.ratePlayer
rating.submitRating
rating.selectRating
rating.addComment
rating.commentPlaceholder
rating.commentMaxLength
rating.ratingRequired
rating.ratingSubmitted
rating.averageRating
rating.noRatingsYet
rating.yourRating
rating.alreadyRated
rating.cannotRate
rating.sessionMustBeFinished
rating.asHost
rating.asPlayer
rating.ratedBy
rating.ratedOn 9. Critical Files to Create/Modify
NEW FILES
/src/lib/api/rating.service.ts - Service layer for all rating API calls
/src/components/rating/StarRatingInput.tsx - Interactive star selector
/src/components/rating/StarRatingDisplay.tsx - Rating display component (most reused)
/src/components/rating/SubmitRatingModal.tsx - Rating submission modal
/src/components/rating/RatingList.tsx - Display list of ratings
/src/components/rating/UserRatingSummaryCard.tsx - Summary card
MODIFY
/src/lib/api/types.ts - Add Rating\*, UserRatingStats, SessionRatingEligibility types; update User, ISession, TransactionSummary
/src/app/[locale]/player/sessions/[id]/page.tsx - Add "Rate Host" button if eligible
/src/app/[locale]/host/sessions/[id]/page.tsx - Add "Rate Players" buttons if eligible
/src/app/[locale]/player/transactions/page.tsx - Fetch & display host ratings
/src/app/[locale]/host/transactions/page.tsx - Fetch & display player ratings
/src/components/payment/TransactionSummaryList.tsx - Add StarRatingDisplay integration
/src/components/player/PlayerDetailModal.tsx - Show player rating & reviews
/src/components/session/FindSessionCard.tsx - Show host rating
/src/i18n/messages/en.json - Add rating i18n keys (+ vi.json, cn.json) 10. Key Dependencies & Patterns
Patterns to Follow
Service Layer Pattern: Follow session.service.ts and payment.service.ts
Modal Pattern: Follow PlayerDetailModal.tsx (CommonModal component)
Component Pattern: Follow existing UI components in /components
Type Organization: Follow /lib/api/types.ts structure
UI Library Dependencies
Existing components: Button, Modal, Input, Textarea, Avatar
Toast notifications: Use existing toaster from UI library
Icons: Star icons from icon library (or SVG stars) 11. Verification Checklist
Manual Testing Scenarios
Player → Host Rating:

✅ Join a session and participate
✅ Session ends (host clicks "End Session")
✅ Player can see "Rate Host" button on session detail
✅ Click button → SubmitRatingModal opens
✅ Select 1-5 stars (try various values)
✅ Optional: Add comment (test max length validation)
✅ Submit → Rating saved, see confirmation
✅ Verify "Rate Host" button changes to show existing rating
✅ Verify rating appears in PlayerDetailModal for this host
Host → Player Rating:

✅ Create session, start it, add/join players
✅ End session
✅ On host session detail, see "Rate" buttons for each player
✅ Click "Rate" button → SubmitRatingModal opens with player name
✅ Submit rating
✅ Verify player card shows rating badge
✅ Verify rating appears in HostTransactionSummary for this player
Rating Display in Transaction Summary:

✅ Open player transactions page
✅ See host rating displayed (or "No ratings" if none)
✅ Open host transactions page
✅ See player rating displayed (or "No ratings" if none)
Rating Display in Session Discovery:

✅ Go to "Find Sessions" page
✅ See host rating displayed next to host name in each session card
✅ Highly-rated hosts have visual indicator (optional)
Edge Cases:

✅ Try to rate before session ends → Button disabled with message
✅ Try to rate twice → Button disabled, existing rating shown
✅ Player not in session → Cannot see "Rate" button
✅ Guest player (no userId) → Cannot give/receive ratings 12. Dependencies on Backend
Must Wait For:

POST /ratings endpoint
GET /ratings endpoint with filters
GET /ratings/session/:sessionId/eligibility endpoint
GET /ratings/user/:userId/stats endpoint
Rating database schema with proper constraints
Can Start Before:

Creating all frontend types, services, and components
Building UI components (using mock data if needed)
Notes
One-time Rating: No edit/delete functionality. If needed in future, can be added as separate feature.
Backend Ownership: Backend team implements database schema, validation, and API endpoints
Frontend Ownership: Frontend team implements UI, service integration, and display logic
i18n Required: All user-facing text must be translatable (EN, VI, CN)
Performance: Consider caching rating stats, pagination for users with many reviews
Mobile-First: All components must be responsive and touch-friendly
