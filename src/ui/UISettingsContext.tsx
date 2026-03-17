import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ui_font_scale';

type UISettings = {
  fontScale: number;
  setFontScale: React.Dispatch<React.SetStateAction<number>>;
};

const UISettingsContext = createContext<UISettings | null>(null);

export const UISettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontScale, setFontScaleState] = useState<number>(1);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v) setFontScaleState(Number(v));
    });
  }, []);

  // 👇 FORCE the correct type here
  const setFontScale: React.Dispatch<React.SetStateAction<number>> = (value) => {
    setFontScaleState(prev => {
      const next =
        typeof value === 'function'
          ? value(prev)
          : value;

      const clamped = Math.min(1.5, Math.max(0.85, next));
      AsyncStorage.setItem(KEY, String(clamped));
      return clamped;
    });
  };

  return (
    <UISettingsContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </UISettingsContext.Provider>
  );
};

export const useUISettings = () => {
  const ctx = useContext(UISettingsContext);
  if (!ctx) throw new Error('useUISettings outside provider');
  return ctx;
};
