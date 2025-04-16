// Date formatting utilities

/**
 * Formats a timestamp (in milliseconds) to a readable date/time string
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  
  // Use Intl.DateTimeFormat for localized formatting
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return formatter.format(date);
};

/**
 * Calculate time difference between current time and a timestamp
 * @param timestamp Timestamp in milliseconds
 * @returns Object containing days, hours, minutes, and seconds
 */
export const getTimeDifference = (timestamp: number) => {
  if (!timestamp) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const now = Date.now();
  const diff = timestamp - now;
  
  // If the timestamp is in the past, return zeros
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60
  };
};

/**
 * Format time difference as a human-readable string
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted time difference string
 */
export const formatTimeDifference = (timestamp: number): string => {
  if (!timestamp) return 'Unknown';
  
  const { days, hours, minutes } = getTimeDifference(timestamp);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return 'Less than a minute';
  }
};

/**
 * Calculate time elapsed since a timestamp
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted elapsed time string
 */
export const getTimeElapsed = (timestamp: number): string => {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  // If the timestamp is in the future, return "Not yet"
  if (diff <= 0) return 'Not yet';
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 30) {
    return `${Math.floor(days / 30)} months ago`;
  } else if (days > 0) {
    return `${days} days ago`;
  } else if (hours > 0) {
    return `${hours} hours ago`;
  } else if (minutes > 0) {
    return `${minutes} minutes ago`;
  } else {
    return 'Just now';
  }
};