# Task: Refactor Expo App to Use UI Kitten (Kitty UI)

## Current State
- The app is a React Native Expo project.
- Styling currently uses **shadcn** (intended for web, not RN).
- App integrates Mapbox GL JS with Zustand state management and PostGIS for storing polygon data.
- React Leaflet is used externally for editing points/polygons with metadata.
- Goal: Meetup-style clean, professional, and beautiful UI.

## Refactor Instructions
1. **Remove shadcn completely**
   - Uninstall all `shadcn/ui`, `radix-ui`, and unused Tailwind/shadcn dependencies.
   - Clean up references in code (imports, styles, components).

2. **Introduce UI Kitten**
   - Install UI Kitten and Eva Design System following official docs:  
     https://github.com/akveo/react-native-ui-kitten
   - Add theming support (light/dark theme, branding colors).
   - Configure `ApplicationProvider` at the root level with the Eva theme.
   - Replace existing shadcn/Tailwind components with equivalent `@ui-kitten/components`.

3. **Design Guidelines**
   - Style the UI to look inspired by the **Meetup app**:
     - Card-based layouts for events, groups, and polygons.
     - Large readable typography.
     - Neutral backgrounds with approachable and innovative fresh accent colors.
     - Smooth, consistent padding, spacing, and shadow usage.
   - Use Eva design tokens and `Layout`, `Card`, `Button`, `Input`, `TabView`, and `TopNavigation` components.

4. **Component Migration**
   - Replace buttons, inputs, cards, and modal dialogs with their UI Kitten counterparts.
   - Introduce `TopNavigation` for headers and consistent screen structure.
   - Use `Card` for displaying events, polygons, and metadata.
   - Integrate icons using UI Kitten’s icon pack (`@ui-kitten/eva-icons`).

5. **State and APIs**
   - Keep Zustand
   - Make the splash and google/facebook auth experience beuatiful 
   - Ensure all functionality remains

6. **Deliverables**
   - A fully styled Expo app using **UI Kitten only** (no shadcn).
   - Centralized theme and design tokens for easy customization.
   - A Meetup-inspired look: modern, stunning, and consistent.
   - Confirm that all polygon editing, state syncing, and PostGIS storage logic remains functional.

---
