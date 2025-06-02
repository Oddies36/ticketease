import { create } from "zustand";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  emailProfessional: string;
  isAdmin: boolean;
};

type UserStore = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));