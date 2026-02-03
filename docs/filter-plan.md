Advanced Search Filter System for Session Discovery
Upgrade the session discovery page with comprehensive filters including geospatial search, skill level color coding, session status filters, and enhanced UI/UX for a modern, user-friendly experience.

User Review Required
IMPORTANT

Geospatial Search Implementation The "Near Me" feature will require user's location permission. When activated, it will:

Request browser geolocation permission
Sort sessions by distance from user's current location
Display distance information on each session card
Fall back to province/district filtering if permission denied
IMPORTANT

Search Query Fields The search bar will query the following fields in the database:

Session name (session.name)
Venue name (venue.name)
Venue address (venue.address)
Location (session.location)
Host name (host.name)
District (venue.district)
City (venue.city)
Please confirm if these fields are appropriate or if you'd like to add/remove any.

IMPORTANT

Skill Level Color Coding Based on session.requiredLevels:

🟢 Green (Beginner): Levels 1-3 (Weak/New)
🟡 Yellow (Intermediate): Levels 4-5 (Medium)
🔴 Red (Advanced): Levels 6-7 (Strong/Try-hard)
⚪ White/Gray (All Levels): No level requirements
Please confirm this mapping aligns with your skill level definitions.

Proposed Changes
Backend Components
[MODIFY]
sessions.service.ts
Update
findAvailable
method to support new query parameters:

Add city and district filters for area-based search
Add minFee, maxFee for cost range filtering
Add status filter for session availability (has slots, full)
Add availableSlots filter for minimum slot requirements
Add searchQuery for full-text search across session name, venue, address, host name
Add geospatial sorting when lat and lng parameters provided
Use Prisma's raw SQL for distance calculation: ST_Distance_Sphere(point(venue.lng, venue.lat), point(?, ?))
[MODIFY]
sessions.controller.ts
Update
getAvailable
endpoint to accept new query parameters:

@Query('city') city?: string
@Query('district') district?: string
@Query('minFee') minFee?: number
@Query('maxFee') maxFee?: number
@Query('hasSlots') hasSlots?: boolean
@Query('minAvailableSlots') minAvailableSlots?: number
@Query('searchQuery') searchQuery?: string
@Query('lat') lat?: number
@Query('lng') lng?: number
@Query('sortByDistance') sortByDistance?: boolean
Frontend Components
[MODIFY]
FindSessionList.tsx
Major UI/UX improvements and filter additions:

State Management:

Add filters: city, district, minFee, maxFee, hasSlots, minAvailableSlots, nearMe
Add userLocation state for geolocation
Add sortByDistance flag
New Filter Components:

Area Filter Section: Two-tier dropdown (City → District)
Cost Filter: Range slider with min/max input fields
Status Filter: Toggle buttons (All, Available Slots, Full)
Available Slots Filter: Number input for minimum slots
Near Me Toggle: Button with geolocation icon that requests permission and sorts by distance
Search Enhancement:

Move from client-side to server-side search
Update
handleSearch
to pass all filters to backend
UI Layout Improvements:

Reorganize filters into collapsible sections for better mobile experience
Add filter count badge to show active filters
Improve responsive design with better breakpoints
Add loading skeleton for better UX during data fetch
[MODIFY]
FindSessionCard.tsx
Add visual enhancements:

Display distance when sorted by geolocation (e.g., "2.3 km away")
Add skill level color indicator (colored dot or border based on requiredLevels)
Show available slots prominently (e.g., "3/16 slots available")
Add visual indicator for sessions with available slots vs full sessions
[MODIFY]
BaseSessionCard.tsx
Enhance base card component:

Add skillLevelColor prop to apply colored left border or badge
Add distance prop to display distance information
Add availableSlots calculation and display
Improve card hover effects and transitions
[MODIFY]
session.service.ts
Update
getAvailableSessions
method signature:

getAvailableSessions: async (filters?: {
date?: string;
level?: number;
city?: string;
district?: string;
minFee?: number;
maxFee?: number;
hasSlots?: boolean;
minAvailableSlots?: number;
searchQuery?: string;
lat?: number;
lng?: number;
sortByDistance?: boolean;
}): Promise<ISession[]>
[MODIFY]
types.ts
Extend ISession interface to include:

distance?: number - Distance from user location in kilometers (calculated by backend)
Translation Files
[MODIFY]
en.json
Add new translation keys in session namespace:

{
"filters": {
"area": "Area",
"city": "City",
"district": "District",
"selectCity": "Select city",
"selectDistrict": "Select district",
"allCities": "All cities",
"allDistricts": "All districts",
"cost": "Cost",
"minFee": "Min fee",
"maxFee": "Max fee",
"sessionStatus": "Session Status",
"allSessions": "All",
"availableSlots": "Available Slots",
"fullSessions": "Full",
"minSlots": "Min. slots available",
"nearMe": "Near Me",
"sortByDistance": "Sort by distance",
"distance": "{{distance}} km away",
"locationPermissionDenied": "Location permission denied",
"skillLevel": {
"beginner": "Beginner",
"intermediate": "Intermediate",
"advanced": "Advanced",
"allLevels": "All levels"
}
},
"slotsAvailable": "{{available}}/{{total}} slots"
}
[MODIFY]
vi.json
Add Vietnamese translations for all new keys.

[MODIFY]
cn.json
Add Chinese translations for all new keys.

Utility Files
[NEW]
geolocation.utils.ts
Create geolocation utility functions:

// Request user location with permission handling
export const getUserLocation = (): Promise<GeolocationPosition>
// Calculate distance between two lat/lng points (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2): number
// Format distance for display (km or m)
export const formatDistance = (distanceInKm: number): string
[NEW]
skillLevel.utils.ts
Create skill level color mapping utility:

export const getSkillLevelColor = (requiredLevels: number[]): {
color: string;
label: string;
emoji: string;
}
// Returns:
// - Green for levels 1-3
// - Yellow for levels 4-5
// - Red for levels 6-7
// - Gray for no requirements
[NEW]
vietnam-locations.ts
Create constants file with Vietnam cities and districts:

export interface IDistrict {
code: string;
name: string;
}
export interface ICity {
code: string;
name: string;
districts: IDistrict[];
}
export const VIETNAM_CITIES: ICity[] = [
// Major cities with districts
{ code: 'HCM', name: 'Hồ Chí Minh', districts: [...] },
{ code: 'HN', name: 'Hà Nội', districts: [...] },
{ code: 'DN', name: 'Đà Nẵng', districts: [...] },
// ... other cities
];
Verification Plan
Automated Tests
Backend API Tests:

# Test new filter parameters

curl "http://localhost:3000/api/sessions/available?city=HCM&district=District1&minFee=50000&maxFee=100000"

# Test geospatial search

curl "http://localhost:3000/api/sessions/available?lat=10.7756&lng=106.7019&sortByDistance=true"

# Test search query

curl "http://localhost:3000/api/sessions/available?searchQuery=badminton"
Frontend Component Tests:

Verify filter UI renders correctly
Test filter state updates
Verify API calls with correct parameters
Test geolocation permission flow
Manual Verification
Filter Functionality:

Test each filter independently
Test multiple filters combined
Verify filter reset functionality
Test mobile responsive design
Geospatial Search:

Grant location permission and verify distance sorting
Deny location permission and verify graceful fallback
Verify distance display on session cards
UI/UX Improvements:

Verify skill level color coding displays correctly
Test available slots display
Verify search bar queries backend
Test filter animations and transitions
Cross-browser Testing:

Test on Chrome, Firefox, Safari
Test on mobile devices (iOS/Android)
Verify geolocation works across browsers
