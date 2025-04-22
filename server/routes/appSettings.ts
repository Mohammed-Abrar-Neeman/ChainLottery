import { Router, Request, Response } from 'express';
import { getAppSettings, updateAppSetting } from '../services/appSettingsService';

export const appSettingsRouter = Router();

// Get all app settings
appSettingsRouter.get('/', (req: Request, res: Response) => {
  try {
    const settings = getAppSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching app settings:', error);
    res.status(500).json({ error: 'Failed to fetch app settings' });
  }
});

// Update the series dropdown visibility setting
appSettingsRouter.post('/seriesDropdown', (req: Request, res: Response) => {
  try {
    // Validate the request body
    const { showSeriesDropdown } = req.body;
    
    if (typeof showSeriesDropdown !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid value for showSeriesDropdown. Expected boolean.' 
      });
    }
    
    // Update the setting
    const updatedSettings = updateAppSetting('showSeriesDropdown', showSeriesDropdown);
    console.log('Series dropdown visibility updated:', showSeriesDropdown);
    
    // Return the updated settings
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating series dropdown setting:', error);
    res.status(500).json({ error: 'Failed to update series dropdown setting' });
  }
});