import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the app settings interface
interface AppSettings {
  showSeriesDropdown: boolean;
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
  updateShowSeriesDropdown: (show: boolean) => Promise<void>;
}

// Create the context
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

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

  // Fetch the settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/settings');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching app settings:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch app settings'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Function to update the series dropdown visibility setting
  const updateShowSeriesDropdown = async (show: boolean): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/seriesDropdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showSeriesDropdown: show }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.status} ${response.statusText}`);
      }
      
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setError(null);
    } catch (err) {
      console.error('Error updating series dropdown setting:', err);
      setError(err instanceof Error ? err : new Error('Failed to update series dropdown setting'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value: AppSettingsContextType = {
    settings,
    loading,
    error,
    updateShowSeriesDropdown,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export default AppSettingsContext;