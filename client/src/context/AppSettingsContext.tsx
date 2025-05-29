import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the app settings interface
interface AppSettings {
  showSeriesDropdown: boolean;
  // Add more settings here as needed
}

// Default settings
const defaultSettings: AppSettings = {
  showSeriesDropdown: true,
};

// Define the context API
interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: Error | null;
  updateShowSeriesDropdown: (show: boolean) => void;
  resetSettings: () => void;
}

// Create the context
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// Local storage key
const STORAGE_KEY = 'app_settings';

// Custom hook to use the app settings context
export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

// Provider component
interface AppSettingsProviderProps {
  children: ReactNode;
}

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      setLoading(true);
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Merge with defaults to ensure all settings exist
        setSettings({ ...defaultSettings, ...parsedSettings });
      } else {
        // If no stored settings, save defaults
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
        setSettings(defaultSettings);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading app settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to load app settings'));
      // Fallback to default settings
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to update the series dropdown visibility setting
  const updateShowSeriesDropdown = (show: boolean): void => {
    try {
      const newSettings = { ...settings, showSeriesDropdown: show };
      setSettings(newSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setError(null);
    } catch (err) {
      console.error('Error updating series dropdown setting:', err);
      setError(err instanceof Error ? err : new Error('Failed to update series dropdown setting'));
    }
  };

  // Function to reset settings to defaults
  const resetSettings = (): void => {
    try {
      setSettings(defaultSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      setError(null);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to reset settings'));
    }
  };

  // Context value
  const value: AppSettingsContextType = {
    settings,
    loading,
    error,
    updateShowSeriesDropdown,
    resetSettings,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export default AppSettingsContext;