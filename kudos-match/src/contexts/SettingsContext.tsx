import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  apiUrl: string;
  setApiUrl: (url: string) => void;
  userToken: string | null;
  setUserToken: (token: string | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  isReady: boolean;
}

export const SettingsContext = createContext<SettingsContextType>({
  apiUrl: 'http://192.168.1.7:8080',
  setApiUrl: () => {},
  userToken: null,
  setUserToken: () => {},
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: () => {},
  isReady: false,
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiUrl, setApiUrlState] = useState('http://192.168.1.7:8080');
  const [userToken, setUserTokenState] = useState<string | null>(null);
  const [hasCompletedOnboarding, setOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [token, url, onb] = await Promise.all([
          AsyncStorage.getItem('@kudos_token'),
          AsyncStorage.getItem('@kudos_api_url'),
          AsyncStorage.getItem('@kudos_onboarded'),
        ]);
        if (token) setUserTokenState(token);
        if (url) setApiUrlState(url);
        if (onb === 'true') setOnboarding(true);
      } catch (e) {}
      finally { setIsReady(true); }
    };
    load();
  }, []);

  const setApiUrl = async (url: string) => {
    setApiUrlState(url);
    await AsyncStorage.setItem('@kudos_api_url', url);
  };

  const setUserToken = async (token: string | null) => {
    setUserTokenState(token);
    if (token) await AsyncStorage.setItem('@kudos_token', token);
    else await AsyncStorage.removeItem('@kudos_token');
  };

  const setHasCompletedOnboarding = async (v: boolean) => {
    setOnboarding(v);
    await AsyncStorage.setItem('@kudos_onboarded', String(v));
  };

  return (
    <SettingsContext.Provider value={{ apiUrl, setApiUrl, userToken, setUserToken, hasCompletedOnboarding, setHasCompletedOnboarding, isReady }}>
      {children}
    </SettingsContext.Provider>
  );
}
