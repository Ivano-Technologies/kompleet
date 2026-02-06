/**
 * Filing Deadline Management Service
 * Sprint 7: Phase 2 Enhancement
 * Calculates deadlines and manages reminder scheduling
 */

import { createClient } from '@/lib/supabase/server';

export interface Deadline {
  id: string;
  form_type: 'PIT' | 'CIT' | 'VAT_Q1' | 'VAT_Q2' | 'VAT_Q3' | 'VAT_Q4';
  tax_year: number;
  deadline_date: string;
  description: string;
  status: 'upcoming' | 'due_soon' | 'overdue';
  days_remaining: number;
}

export interface Reminder {
  id: string;
  deadline_id: string;
  reminder_date: string;
  sent: boolean;
  days_before: number;
}

/**
 * Calculate deadline status based on current date
 */
export function calculateDeadlineStatus(deadlineDate: string): {
  status: 'upcoming' | 'due_soon' | 'overdue';
  daysRemaining: number;
} {
  const now = new Date();
  const deadline = new Date(deadlineDate);
  const diffTime = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status: 'upcoming' | 'due_soon' | 'overdue';
  if (daysRemaining < 0) {
    status = 'overdue';
  } else if (daysRemaining <= 7) {
    status = 'due_soon';
  } else {
    status = 'upcoming';
  }

  return {
    status,
    daysRemaining
  };
}

/**
 * Get all deadlines for a specific tax year
 */
export async function getDeadlines(taxYear: number): Promise<Deadline[]> {
  try {
    const supabase = await createClient();

    const { data: deadlines, error } = await supabase
      .from('filing_deadlines')
      .select('*')
      .eq('tax_year', taxYear)
      .order('deadline_date', { ascending: true });

    if (error) {
      console.error('Error fetching deadlines:', error);
      return [];
    }

    // Calculate status for each deadline
    return deadlines.map(deadline => {
      const { status, daysRemaining } = calculateDeadlineStatus(deadline.deadline_date);
      return {
        ...deadline,
        status,
        days_remaining: daysRemaining
      };
    });

  } catch (error) {
    console.error('Get deadlines error:', error);
    return [];
  }
}

/**
 * Get upcoming deadlines (within next 30 days)
 */
export async function getUpcomingDeadlines(userId: string): Promise<Deadline[]> {
  try {
    const supabase = await createClient();

    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const { data: deadlines, error } = await supabase
      .from('filing_deadlines')
      .select('*')
      .gte('deadline_date', now.toISOString().split('T')[0])
      .lte('deadline_date', thirtyDaysLater.toISOString().split('T')[0])
      .order('deadline_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming deadlines:', error);
      return [];
    }

    // Calculate status for each deadline
    return deadlines.map(deadline => {
      const { status, daysRemaining } = calculateDeadlineStatus(deadline.deadline_date);
      return {
        ...deadline,
        status,
        days_remaining: daysRemaining
      };
    });

  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    return [];
  }
}

/**
 * Schedule reminders for a deadline (7, 3, 1 day before)
 */
export async function scheduleReminders(userId: string, deadlineId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Fetch deadline
    const { data: deadline, error: deadlineError } = await supabase
      .from('filing_deadlines')
      .select('*')
      .eq('id', deadlineId)
      .single();

    if (deadlineError || !deadline) {
      console.error('Deadline not found:', deadlineError);
      return false;
    }

    const deadlineDate = new Date(deadline.deadline_date);
    const reminders = [
      { daysBefore: 7, date: new Date(deadlineDate.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { daysBefore: 3, date: new Date(deadlineDate.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { daysBefore: 1, date: new Date(deadlineDate.getTime() - 1 * 24 * 60 * 60 * 1000) }
    ];

    // Check if reminders already exist
    const { data: existingReminders } = await supabase
      .from('deadline_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('deadline_id', deadlineId);

    if (existingReminders && existingReminders.length > 0) {
      console.log('Reminders already scheduled for this deadline');
      return true;
    }

    // Create reminder records
    const reminderRecords = reminders
      .filter(r => r.date > new Date()) // Only future reminders
      .map(r => ({
        user_id: userId,
        deadline_id: deadlineId,
        reminder_date: r.date.toISOString().split('T')[0],
        sent: false
      }));

    if (reminderRecords.length === 0) {
      console.log('No future reminders to schedule');
      return true;
    }

    const { error: insertError } = await supabase
      .from('deadline_reminders')
      .insert(reminderRecords);

    if (insertError) {
      console.error('Error scheduling reminders:', insertError);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Schedule reminders error:', error);
    return false;
  }
}

/**
 * Get pending reminders that need to be sent today
 */
export async function getPendingReminders(): Promise<Reminder[]> {
  try {
    const supabase = await createClient();

    const today = new Date().toISOString().split('T')[0];

    const { data: reminders, error } = await supabase
      .from('deadline_reminders')
      .select(`
        *,
        filing_deadlines (
          form_type,
          tax_year,
          deadline_date,
          description
        )
      `)
      .eq('reminder_date', today)
      .eq('sent', false);

    if (error) {
      console.error('Error fetching pending reminders:', error);
      return [];
    }

    return reminders.map(r => {
      const deadline = r.filing_deadlines as any;
      const deadlineDate = new Date(deadline.deadline_date);
      const reminderDate = new Date(r.reminder_date);
      const daysBefore = Math.ceil((deadlineDate.getTime() - reminderDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...r,
        days_before: daysBefore
      };
    });

  } catch (error) {
    console.error('Get pending reminders error:', error);
    return [];
  }
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(reminderId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('deadline_reminders')
      .update({
        sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', reminderId);

    if (error) {
      console.error('Error marking reminder as sent:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Mark reminder sent error:', error);
    return false;
  }
}

/**
 * Auto-schedule reminders for all users for upcoming deadlines
 */
export async function autoScheduleRemindersForAllUsers(): Promise<number> {
  try {
    const supabase = await createClient();

    // Get all authenticated users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return 0;
    }

    // Get upcoming deadlines (next 60 days)
    const now = new Date();
    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(now.getDate() + 60);

    const { data: deadlines, error: deadlinesError } = await supabase
      .from('filing_deadlines')
      .select('*')
      .gte('deadline_date', now.toISOString().split('T')[0])
      .lte('deadline_date', sixtyDaysLater.toISOString().split('T')[0]);

    if (deadlinesError || !deadlines) {
      console.error('Error fetching deadlines:', deadlinesError);
      return 0;
    }

    let scheduledCount = 0;

    // Schedule reminders for each user and deadline
    for (const user of users) {
      for (const deadline of deadlines) {
        const success = await scheduleReminders(user.id, deadline.id);
        if (success) {
          scheduledCount++;
        }
      }
    }

    return scheduledCount;

  } catch (error) {
    console.error('Auto-schedule reminders error:', error);
    return 0;
  }
}

/**
 * Get user's reminder preferences
 */
export async function getReminderPreferences(userId: string): Promise<{
  enabled: boolean;
  email: boolean;
  inApp: boolean;
}> {
  try {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('reminder_preferences')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      // Default preferences
      return {
        enabled: true,
        email: true,
        inApp: true
      };
    }

    return profile.reminder_preferences || {
      enabled: true,
      email: true,
      inApp: true
    };

  } catch (error) {
    console.error('Get reminder preferences error:', error);
    return {
      enabled: true,
      email: true,
      inApp: true
    };
  }
}
