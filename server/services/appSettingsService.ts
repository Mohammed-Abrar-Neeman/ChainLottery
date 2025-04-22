import * as fs from 'fs';
import * as path from 'path';

// Define the settings file path
const settingsFilePath = path.join(process.cwd(), 'server/appSettings.json');

// Define the app settings interface
export interface AppSettings {
  showSeriesDropdown: boolean;
  // Add other global app settings as needed
}

// Get app settings
export const getAppSettings = (): AppSettings => {
  try {
    if (!fs.existsSync(settingsFilePath)) {
      // If the file doesn't exist, create it with default settings
      const defaultSettings: AppSettings = {
        showSeriesDropdown: true
      };
      fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }

    const fileContent = fs.readFileSync(settingsFilePath, 'utf8');
    return JSON.parse(fileContent) as AppSettings;
  } catch (error) {
    console.error('Error reading app settings:', error);
    // Return default settings in case of error
    return { showSeriesDropdown: true };
  }
};

// Update a specific app setting
export const updateAppSetting = <K extends keyof AppSettings>(
  key: K, 
  value: AppSettings[K]
): AppSettings => {
  try {
    const currentSettings = getAppSettings();
    const updatedSettings = { ...currentSettings, [key]: value };
    
    // Write updated settings to file
    fs.writeFileSync(settingsFilePath, JSON.stringify(updatedSettings, null, 2));
    console.log(`Updated app setting: ${key} = ${JSON.stringify(value)}`);
    
    return updatedSettings;
  } catch (error) {
    console.error(`Error updating app setting ${key}:`, error);
    throw error;
  }
};