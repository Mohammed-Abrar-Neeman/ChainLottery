import { useCallback } from 'react';
import { LotteryDraw } from '@/lib/lotteryContract';

/**
 * Hook to get the date of a lottery draw in a formatted string
 */
export function useDrawDate() {
  /**
   * Get a formatted date string for a draw
   * @param draws Array of lottery draws
   * @param drawId The ID of the draw to get the date for
   * @returns Formatted date string (MM/DD/YY)
   */
  const getDrawDate = useCallback((draws: LotteryDraw[] | undefined, drawId?: number): string => {
    if (!drawId || !draws || draws.length === 0) return '';
    
    const draw = draws.find(d => d.drawId === drawId);
    if (!draw) {
      // If no draw found, return current date as fallback
      const today = new Date();
      return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear().toString().substr(2, 2)}`;
    }
    
    // Use the endTimestamp if available
    let dateToUse: Date;
    if (draw.endTimestamp && draw.endTimestamp > 0) {
      // Convert seconds to milliseconds for Date constructor
      dateToUse = new Date(draw.endTimestamp * 1000);
    } else {
      // Fallback: Use current date with offset based on drawId
      dateToUse = new Date();
      dateToUse.setDate(dateToUse.getDate() + (drawId % 7));
    }
    
    // Format the date as MM/DD/YY
    const month = dateToUse.getMonth() + 1;
    const day = dateToUse.getDate();
    const year = dateToUse.getFullYear().toString().substr(2, 2);
    
    return `${month}/${day}/${year}`;
  }, []);

  return { getDrawDate };
}