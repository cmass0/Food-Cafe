import { useContext, createContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { Auth, db } from "@/data/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userAuthData, setUserAuthData] = useState("userK");

  function googleLogin() {
    const Googleprovider = new GoogleAuthProvider();
    signInWithPopup(Auth, Googleprovider);
  }

  function logout() {
    signOut(Auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(Auth, async (curUser) => {
      if (curUser) {
        const userref = doc(db, "User", curUser.uid);
        const userSnap = await getDoc(userref);
        if (!userSnap.exists()) {
          await setDoc(userref, {
            id: curUser.uid,
            email: curUser.email,
            name: curUser.displayName,
            likerecipe: [],
          });
        }
        setUserAuthData(curUser);
      }
      setUserAuthData(null);
    });

    return () => unsubscribe;
  }, [userAuthData]);

  return (
    <AuthContext.Provider value={{ userAuthData, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthUser() {
  return useContext(AuthContext);
}
