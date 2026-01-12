# Refactor Custom Modals to CommonModal

Successfully refactored multiple custom modal implementations across the frontend to utilize the standardized `CommonModal` component. This effort has improved code consistency, reduced boilerplate, and enhanced the UI/UX with smooth animations and better structure.

## Components Refactored

- **Player Management & Grid**:
  - `PlayerGrid.tsx`: Refactored confirmation dialog for pausing/continuing players.
  - `PlayerDetailModal.tsx`: Standardized player info view with QR code.
  - `PlayerManagement.tsx`: Refactored "Max Players Warning" and "Player QR Code" modals.

- **Match & Court Flow**:
  - `MatchPreviewModal.tsx`: Refactored auto-match confirmation view.
  - `ManualSelectPlayersModal.tsx`: Standardized manual player selection modal.
  - `MatchResultModal.tsx`: Refactored match outcome and score entry modal.

- **Session Administration**:
  - `SessionDetailContent.tsx`: Refactored end session confirmation dialog.
  - `GeneralSettings.tsx`: Refactored level requirements change confirmation.

## CommonModal Improvements

- **isSecondaryDisabled**: Added a new prop to control the disabled state of the secondary (Cancel) button, ensuring consistent loading states across actions.
- **Size Support**: Standardized sizes (`sm`, `md`, `lg`, `xl`, `full`) used across all refactored components.
- **Custom Footer**: Successfully implemented custom footer support for complex modals like `MatchPreviewModal` which requires a "Back" button.

## Benefits Achieved

1. **Standardized UI**: Consistent spacing, fonts, and button styles across all overlays.
2. **Reduced Boilerplate**: Removed repetitive `position="fixed"`, overlay click handling, and Escape key logic from individual components.
3. **Improved UX**: Added entry animations and standardized scroll behavior for long content.
4. **Maintainability**: Centralized modal logic in one place, making future global UI updates much easier.
