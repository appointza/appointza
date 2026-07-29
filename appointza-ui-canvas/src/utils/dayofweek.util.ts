/**
 * Utility functions for day-of-week operations
 */
export class DayOfWeekUtil {
  /**
   * Get day name from day number (Monday=1, Sunday=7)
   */
  static getDayNameFromNumber(dayNumber: number): string {
    const dayNames = {
      1: 'Monday',
      2: 'Tuesday', 
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      7: 'Sunday',
    };
    return dayNames[dayNumber as keyof typeof dayNames] || `Day ${dayNumber}`;
  }

  /**
   * Get day name from day number (Sunday=0 format)
   */
  static getDayNameFromDotNetDay(dayNumber: number): string {
    const dayNames = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
    };
    return dayNames[dayNumber as keyof typeof dayNames] || `Day ${dayNumber}`;
  }

  /**
   * Convert .NET DayOfWeek (Sunday=0) to our format (Monday=1)
   */
  static fromDotNetDayOfWeek(dayOfWeek: number): number {
    return ((dayOfWeek + 6) % 7) + 1;
  }

  /**
   * Convert our format (Monday=1) to .NET DayOfWeek (Sunday=0)
   */
  static toDotNetDayOfWeek(dayNumber: number): number {
    return ((dayNumber - 1 + 1) % 7);
  }

  /**
   * Get all days of week in order
   */
  static getAllDays(): Array<{ id: number; label: string }> {
    return [
      { id: 1, label: 'Monday' },
      { id: 2, label: 'Tuesday' },
      { id: 3, label: 'Wednesday' },
      { id: 4, label: 'Thursday' },
      { id: 5, label: 'Friday' },
      { id: 6, label: 'Saturday' },
      { id: 7, label: 'Sunday' },
    ];
  }

  /**
   * Check if a day number is valid
   */
  static isValidDayNumber(dayNumber: number): boolean {
    return dayNumber >= 1 && dayNumber <= 7;
  }
}
