export interface Member {
  id: string;
  name: string;
  phone: string;
  morning_time: string;
  evening_time: string;
  relation: "patient" | "family";
  source: string;
}

export interface Medicine {
  id: string;
  name: string;
  quantity: number;
  dosage_per_day: number;
  purchase_date: string;
  depletion_date: string;
  active: boolean;
  overdue: boolean;
  days_remaining: number;
}

export interface ReminderLog {
  id: string;
  recipient_name: string;
  phone: string;
  slot: "morning" | "evening";
  log_date: string;
  sent_at: string;
  message: string;
  status: "sent" | "error";
  error: string | null;
}

export interface FamilyStatus {
  family_id: string;
  members: Member[];
  medicines: Medicine[];
  status: "active" | "paused";
  next_reminder_at: string | null;
  days_remaining: number | null;
  last_sms: ReminderLog | null;
  recent_logs: ReminderLog[];
}

export interface Family {
  id: string;
  name: string;
}
