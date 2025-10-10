import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// State for RatingScreen form
interface RatingFormState {
  rating: number;
  setRating: (value: number) => void;
  ratingType: 'stall' | 'market';
  setRatingType: (type: 'stall' | 'market') => void;
  stallName: string;
  setStallName: (name: string) => void;
  mobilePayCode: string;
  setMobilePayCode: (code: string) => void;
  comments: string;
  setComments: (comments: string) => void;
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  showFullScreen: boolean;
  setShowFullScreen: (show: boolean) => void;
  showCamera: boolean;
  setShowCamera: (show: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
}

const initialState = {
  rating: 5,
  ratingType: 'stall' as 'stall' | 'market',
  stallName: '',
  mobilePayCode: '',
  comments: '',
  photoUri: null,
  showFullScreen: false,
  showCamera: false,
  isSubmitting: false,
};

export const useRatingFormStore = create<RatingFormState>()(
  persist(
    (set) => ({
      ...initialState,
      setRating: (value) => set({ rating: value }),
      setRatingType: (type) => set({ ratingType: type }),
      setStallName: (name) => set({ stallName: name }),
      setMobilePayCode: (code) => set({ mobilePayCode: code }),
      setComments: (comments) => set({ comments }),
      setPhotoUri: (uri) => set({ photoUri: uri }),
      setShowFullScreen: (show) => set({ showFullScreen: show }),
      setShowCamera: (show) => set({ showCamera: show }),
      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
      resetForm: () => set({ ...initialState }),
    }),
    {
      name: 'rating-form-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        rating: state.rating,
        ratingType: state.ratingType,
        stallName: state.stallName,
        mobilePayCode: state.mobilePayCode,
        comments: state.comments,
        photoUri: state.photoUri,
      }),
    }
  )
);
