export interface Booking {
  id?: number;
  name: string;
  email?: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:00
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
