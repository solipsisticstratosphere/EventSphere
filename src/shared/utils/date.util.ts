export class DateUtil {
  static isPast(date: Date | string): boolean {
    return new Date(date) < new Date();
  }

  static isFuture(date: Date | string): boolean {
    return new Date(date) > new Date();
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  static format(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    const d = new Date(date);
    return format
      .replace('YYYY', d.getFullYear().toString())
      .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
      .replace('DD', d.getDate().toString().padStart(2, '0'))
      .replace('HH', d.getHours().toString().padStart(2, '0'))
      .replace('mm', d.getMinutes().toString().padStart(2, '0'))
      .replace('ss', d.getSeconds().toString().padStart(2, '0'));
  }
}


