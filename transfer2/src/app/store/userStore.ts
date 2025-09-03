import { create } from "zustand";

/**
 * Type représentant un utilisateur.
 * Contient uniquement les infos utiles côté frontend.
 */
type User = {
  id: number;
  firstName: string;
  lastName: string;
  emailProfessional: string;
  isAdmin: boolean;
};

/**
 * Type du store utilisateur.
 * - user : l'utilisateur connecté ou null si personne connecté
 * - setUser : permet de définir un utilisateur dans le store
 * - clearUser : permet de vider l'utilisateur (déconnexion)
 */
type UserStore = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

/**
 * Store Zustand pour gérer l'utilisateur globalement dans l'application.
 * On utilise useUserStore() dans les composants pour accéder ou modifier l'utilisateur.
 */
export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
