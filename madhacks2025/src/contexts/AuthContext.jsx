import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";

const AuthContext = createContext({
  user: null,
  profile: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Load Firestore profile for logged-in user
  const loadUserProfile = async (uid) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setProfile(snap.data());
    } else {
      setProfile(null);
    }
  };

  // Firebase auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadUserProfile(u.uid);
      else setProfile(null);
    });
    return unsub;
  }, []);

  // Email/password login
  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Email/password signup + Firestore user creation
  const signup = async (email, password, bio, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      name,
      bio,
      createdAt: serverTimestamp(),
    });
    await loadUserProfile(cred.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

