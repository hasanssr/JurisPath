import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../services/supabaseClient';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [credits, setCredits] = useState(5);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', userId)
        .single();
      
      if (data) {
        setCredits(data.credits);
      }
    } catch (err) {
      console.log('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      }
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const currentUser = newSession?.user ?? null;
        setSession(newSession);
        setUser(currentUser);

        if (currentUser) {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', currentUser.id)
            .single();

          if (!existingProfile) {
            const fullName =
              currentUser.user_metadata?.full_name ||
              currentUser.user_metadata?.name ||
              currentUser.email?.split('@')[0] || 'Kullanıcı';

            await supabase.from('user_profiles').insert({
              id: currentUser.id,
              full_name: fullName,
              email: currentUser.email,
              credits: 5,
            });
            setCredits(5);
          } else {
            fetchProfile(currentUser.id);
          }
        } else {
          setCredits(5);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Email/Password Sign Up ──────────────────────
  const signUpWithEmail = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) throw error;
    return data;
  };

  // ── Email/Password Sign In ──────────────────────
  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  // ── Google OAuth Sign In ────────────────────────
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'jurispath',
        path: 'auth-callback',
      });
      console.log('Generated Redirect URL for Supabase Dashboard:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      // Open the OAuth URL in the browser directly and cleanly
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      if (result.type === 'success') {
        // Extract tokens manually to avoid React Native URLSearchParams compatibility issues
        const url = result.url;
        const hashParams = url.split('#')[1] || url.split('?')[1] || '';
        const parts = hashParams.split('&');
        
        let accessToken = '';
        let refreshToken = '';
        
        parts.forEach(part => {
          const [key, val] = part.split('=');
          if (key === 'access_token') accessToken = val;
          if (key === 'refresh_token') refreshToken = val;
        });

        if (accessToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
          return sessionData;
        }
      }
    } catch (error) {
      throw error;
    }
  };

  // ── Sign Out ────────────────────────────────────
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // ── Password Reset ──────────────────────────────
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  // ── Update/Modify Credits ───────────────────────
  const updateCreditsInDb = async (newCredits) => {
    if (!user) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({ credits: newCredits })
      .eq('id', user.id);

    if (error) throw error;
    setCredits(newCredits);
  };

  const value = {
    user,
    session,
    loading,
    credits,
    refreshCredits: () => user && fetchProfile(user.id),
    updateCredits: updateCreditsInDb,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
