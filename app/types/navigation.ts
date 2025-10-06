// Navigation type definitions
export type RootTabParamList = {
  Home: undefined;
  Markets: undefined;
  Rating: undefined;
  More: undefined;
};

export type MoreStackParamList = {
  MoreMain: undefined;
  MyRatings: undefined;
  Privacy: undefined;
  Organiser: undefined;
  Advertising: undefined;
  About: undefined;
  Contact: undefined;
};

// Declare global navigation types for React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}