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
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
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