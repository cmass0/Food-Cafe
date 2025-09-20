"use client";

import { useContext, createContext, useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createUser, getUser } from "@/features/user/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userAuthData, setUserAuthData] = useState(null);

  function googleLogin() {
    const Googleprovider = new GoogleAuthProvider();
    signInWithPopup(auth, Googleprovider);
  }

  function logout() {
    signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (curUser) => {
      if (curUser) {
        try {
          const existing = await getUser(curUser.uid);
          if (!existing) {
            await createUser({
              id: curUser.uid,
              email: curUser.email ?? "",
              username: curUser.displayName ?? "user",
            });
          }
        } catch (error) {
          console.error("Failed to ensure user profile", error);
        }
        setUserAuthData(curUser);
      } else {
        setUserAuthData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ userAuthData, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthUser() {
  return useContext(AuthContext);
}
