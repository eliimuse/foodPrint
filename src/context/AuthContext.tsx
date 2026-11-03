import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

export interface SignUpMetadata {
  full_name: string;
  hostel_block: string;
  room_no: string;
  role?: UserRole;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null; user?: User | null; profile?: UserProfile | null }>;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: AuthError | Error | null; user?: User | null; profile?: UserProfile | null }>;
  signOut: () => Promise<void>;
  
  // Convenience & backward compatibility
  isAuthenticated: boolean;
  login: (email: string, password?: string, fullName?: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Fetches profile from 'profiles' table. If missing, creates it client-side as a fallback.
 */
async function fetchOrCreateProfile(
  supabaseUser: User,
  metadataFallback?: Partial<SignUpMetadata>
): Promise<UserProfile> {
  const meta = supabaseUser.user_metadata || {};
  const fallbackRole: UserRole = (meta.role as UserRole) || metadataFallback?.role || 'hosteler';
  const fallbackFullName: string = meta.full_name || metadataFallback?.full_name || supabaseUser.email?.split('@')[0] || 'Hosteler';
  const fallbackRoomNo: string = meta.room_no || meta.room_number || metadataFallback?.room_no || '';
  const fallbackHostelBlock: string = meta.hostel_block || metadataFallback?.hostel_block || '';

  try {
    // 1. Check if row exists in public.profiles
    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (existing && !selectError) {
      return {
        id: existing.id,
        email: existing.email || supabaseUser.email || '',
        full_name: existing.full_name || fallbackFullName,
        role: (existing.role as UserRole) || fallbackRole,
        room_number: existing.room_number || fallbackRoomNo,
        room_no: existing.room_number || fallbackRoomNo,
        hostel_block: existing.hostel_block || fallbackHostelBlock,
        created_at: existing.created_at,
      };
    }

    // 2. Profile missing (trigger not configured or not yet fired) -> Fallback client-side creation
    const profileToInsert = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      full_name: fallbackFullName,
      role: fallbackRole,
      room_number: fallbackRoomNo,
      hostel_block: fallbackHostelBlock,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .upsert(profileToInsert, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (inserted && !insertError) {
      return {
        id: inserted.id,
        email: inserted.email || supabaseUser.email || '',
        full_name: inserted.full_name,
        role: inserted.role as UserRole,
        room_number: inserted.room_number,
        room_no: inserted.room_number,
        hostel_block: inserted.hostel_block,
        created_at: inserted.created_at,
      };
    }
  } catch (err) {
    console.warn('Profile fetch/creation fallback notice:', err);
  }

  // 3. In-memory profile fallback if network or table creation failed
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    full_name: fallbackFullName,
    role: fallbackRole,
    room_number: fallbackRoomNo,
    room_no: fallbackRoomNo,
    hostel_block: fallbackHostelBlock,
    created_at: new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session & register listener
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Error reading Supabase session:', error.message);
        }

        if (isMounted) {
          if (session?.user) {
            setUser(session.user);
            const userProf = await fetchOrCreateProfile(session.user);
            if (isMounted) {
              setProfile(userProf);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Unexpected error in initializeAuth:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const userProf = await fetchOrCreateProfile(session.user);
          if (isMounted) {
            setProfile(userProf);
            setLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;
    const prof = await fetchOrCreateProfile(user);
    setProfile(prof);
    return prof;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        const userProf = await fetchOrCreateProfile(data.user);
        setProfile(userProf);
        setLoading(false);
        return { error: null, user: data.user, profile: userProf };
      }

      setLoading(false);
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    setLoading(true);
    try {
      const targetRole = metadata.role || 'hosteler';
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: metadata.full_name.trim(),
            hostel_block: metadata.hostel_block.trim(),
            room_no: metadata.room_no.trim(),
            room_number: metadata.room_no.trim(),
            role: targetRole,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        const userProf = await fetchOrCreateProfile(data.user, metadata);
        setProfile(userProf);
        setLoading(false);
        return { error: null, user: data.user, profile: userProf };
      }

      setLoading(false);
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  // Backward compatibility alias
  const login = async (email: string, password?: string) => {
    return signIn(email, password || 'password123');
  };

  const logout = async () => {
    return signOut();
  };

  const currentRole: UserRole | null = profile?.role || (user?.user_metadata?.role as UserRole) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: currentRole,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
