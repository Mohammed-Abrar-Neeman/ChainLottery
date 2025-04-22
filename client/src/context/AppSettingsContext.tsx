import React, { createContext, useState, useContext, useEffect } from 'react';

// Define the interface for the app settings
interface AppSettings {
  showSeriesDropdown: boolean;
}

// Define the shape of the context
interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

// Create the context with a default value
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// Custom hook for consuming the context
export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}

// Default settings
const defaultSettings: AppSettings = {
  showSeriesDropdown: true,
};

// Provider component
export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with localStorage or default settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Try to get the settings from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  // Function to update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  // Value to be provided by the context
  const value = {
    settings,
    updateSettings,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}