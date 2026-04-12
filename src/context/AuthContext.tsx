import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { auth, db } from '../lib/firebase';
import firebaseConfig from '../firebase-applet-config.json';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (employeeId: string, password: string) => Promise<void>;
  registerStaff: (employeeId: string, name: string, role: UserRole) => Promise<void>;
  bootstrapManager: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ID_SUFFIX = "@savory.local";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          // Retry logic for profile fetching
          if (!userDoc.exists()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          }

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            // Ensure the designated owner email always has the manager role
            if (firebaseUser.email === "vengatkbkb@gmail.com" && data.role !== 'manager') {
              const updatedProfile = { ...data, role: 'manager' as UserRole };
              await setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile, { merge: true });
              setProfile(updatedProfile);
            } else {
              setProfile(data);
            }
          } else if (firebaseUser.email === "vengatkbkb@gmail.com") {
            // Auto-bootstrap manager profile for the designated user
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              employeeId: "MANAGER-OWNER",
              email: firebaseUser.email,
              name: firebaseUser.displayName || "Manager",
              role: "manager",
              createdAt: Timestamp.now(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async (employeeId: string, password: string) => {
    const email = employeeId.trim().toUpperCase() + ID_SUFFIX;
    const cleanPassword = password.trim().toUpperCase();
    console.log(`Attempting login for: ${email}`);
    try {
      await signInWithEmailAndPassword(auth, email, cleanPassword);
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      throw error;
    }
  };

  const registerStaff = async (employeeId: string, name: string, role: UserRole) => {
    const email = employeeId.toUpperCase() + ID_SUFFIX;
    const password = employeeId.toUpperCase();
    
    // Create a secondary app instance to prevent logging out the current manager
    const secondaryAppName = `secondary-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newProfile: UserProfile = {
        uid: newUser.uid,
        employeeId: employeeId.toUpperCase(),
        email,
        name,
        role,
        createdAt: Timestamp.now(),
      };
      await setDoc(doc(db, 'users', newUser.uid), newProfile);
      
      // Clean up secondary app
      await signOut(secondaryAuth);
    } catch (error) {
      console.error("Error registering staff:", error);
      throw error;
    }
  };

  const bootstrapManager = async () => {
    const employeeId = "2026MAN01";
    const email = employeeId + ID_SUFFIX;
    const password = employeeId;
    
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      const newProfile: UserProfile = {
        uid: newUser.uid,
        employeeId,
        email,
        name: "System Manager",
        role: "manager",
        createdAt: Timestamp.now(),
      };
      await setDoc(doc(db, 'users', newUser.uid), newProfile);
      setProfile(newProfile);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        await login(employeeId, password);
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password auth is DISABLED in Firebase. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, registerStaff, bootstrapManager, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
