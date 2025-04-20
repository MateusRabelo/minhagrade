import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, IntegrationCredentials } from '../types/User';
import { academicIntegrationService } from '../utils/academicIntegration';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, institution?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  startIntegration: (credentials: IntegrationCredentials) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Carregar perfil do usuário do Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Criar perfil padrão se não existir
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              integrationStatus: 'none'
            };
            
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setUserProfile(newProfile);
            } catch (error) {
              console.error('Erro ao criar perfil:', error);
              // Mesmo com erro, definimos o perfil no estado local
              setUserProfile(newProfile);
            }
          }
        } catch (error) {
          console.error('Erro ao acessar Firestore:', error);
          // Criar perfil local apenas no estado se houver erro de permissão
          const localProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            integrationStatus: 'none'
          };
          setUserProfile(localProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, institution?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Criar perfil do usuário no Firestore
    const newUser: UserProfile = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: userCredential.user.displayName || '',
      photoURL: userCredential.user.photoURL || '',
      institution: institution || '',
      integrationStatus: 'none'
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, data);
      
      // Atualizar estado local
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      // Atualizar apenas o estado local se houver erro
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
      // Não propagar o erro para não interromper o fluxo
    }
  };

  const startIntegration = async (credentials: IntegrationCredentials) => {
    if (!currentUser) throw new Error('No user logged in');
    
    // Atualizando estado local primeiro para feedback imediato
    setUserProfile(prev => prev ? { 
      ...prev, 
      integrationStatus: 'pending',
      institution: credentials.institution,
      studentId: credentials.username
    } : null);
    
    try {
      // Atualizando status de integração para "pending" no Firestore
      await updateUserProfile({ 
        integrationStatus: 'pending',
        institution: credentials.institution,
        studentId: credentials.username
      });
      
      try {
        // Usar o serviço de integração acadêmica
        await academicIntegrationService.startIntegration(currentUser.uid, credentials);
        
        // Recarregar o perfil do usuário
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Atualizamos o estado local para 'complete' mesmo se não conseguirmos recarregar o perfil
            setUserProfile(prev => prev ? { 
              ...prev, 
              integrationStatus: 'complete',
              lastSync: new Date().toISOString()
            } : null);
          }
        } catch (loadError) {
          // Em caso de erro ao recarregar, atualizar estado local
          setUserProfile(prev => prev ? { 
            ...prev, 
            integrationStatus: 'complete',
            lastSync: new Date().toISOString()
          } : null);
        }
      } catch (error) {
        // Em caso de erro na integração
        console.error('Erro na integração:', error);
        
        // Atualizar Firestore se possível
        try {
          await updateUserProfile({
            integrationStatus: 'error'
          });
        } catch (updateError) {
          // Se falhar, pelo menos atualizar estado local
          setUserProfile(prev => prev ? { ...prev, integrationStatus: 'error' } : null);
        }
        
        // Propagar o erro para o componente exibir uma mensagem
        throw error;
      }
    } catch (error) {
      // Erros de Firestore já são tratados em updateUserProfile
      // Propagar apenas erros de integração
      if (error !== undefined) throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
    startIntegration
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 