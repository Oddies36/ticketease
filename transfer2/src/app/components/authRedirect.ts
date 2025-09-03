"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";

export const authRedirect = () => {
  const [loading, setLoading] = useState(true);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        //On appelle l'API me et on demande d'inclure le cookie
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          //On sauvegarde le user en mémoire
          const userData = await res.json();
          setUser(userData);
        } else {
          //Sinon on nettoie et on redirige vers /login
          clearUser();
          router.replace("/login");
        }
      } catch {
        clearUser();
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [setUser, clearUser, router]);

  return { loading, user };
};
