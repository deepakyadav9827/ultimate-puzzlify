
'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { errorEmitter } from './error-emitter';
import { toast } from '@/hooks/use-toast';

interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: any) => {
      toast({
        variant: "destructive",
        title: "Security Protocol Breach",
        description: error.message || "The matrix blocked your synchronization request.",
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}

export function FirebaseProvider({ 
  children, 
  app, 
  db, 
  auth 
}: { 
  children: ReactNode; 
  app: FirebaseApp; 
  db: Firestore; 
  auth: Auth;
}) {
  return (
    <FirebaseContext.Provider value={{ app, db, auth }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
}

export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().db;
export const useAuth = () => useFirebase().auth;
