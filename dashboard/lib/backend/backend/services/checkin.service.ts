import { Checkin, Ticket } from '../types/database.types';

export interface CheckinResult {
  success: boolean;
  code:
    | 'CHECKIN_SUCCESS'
    | 'INVALID_TICKET'
    | 'ALREADY_CHECKED_IN'
    | 'EVENT_MISMATCH'
    | 'TICKET_CANCELLED';
  message: string;
  checkin?: Checkin;
  attendeeName?: string;
  eventName?: string;
}

export class CheckinService {
  /**
   * Evaluates check-in attempt against business rules
   */
  static processCheckinRules(
    ticket: Ticket | null,
    targetEventId: string,
    existingCheckins: Checkin[],
    operatorUserId?: string,
    deviceInfo?: string
  ): CheckinResult {
    if (!ticket) {
      return {
        success: false,
        code: 'INVALID_TICKET',
        message: 'No active ticket found matching this QR code.',
      };
    }

    if (ticket.event_id !== targetEventId) {
      return {
        success: false,
        code: 'EVENT_MISMATCH',
        message: 'This ticket is registered for a different event!',
      };
    }

    if (ticket.status !== 'ACTIVE') {
      return {
        success: false,
        code: 'TICKET_CANCELLED',
        message: `Ticket cannot be used because its status is ${ticket.status}.`,
      };
    }

    const isAlreadyCheckedIn = existingCheckins.some((c) => c.ticket_id === ticket.id);
    if (isAlreadyCheckedIn) {
      return {
        success: false,
        code: 'ALREADY_CHECKED_IN',
        message: 'Attendee has ALREADY been checked in for this event!',
      };
    }

    const newCheckin: Checkin = {
      id: `chk-${Date.now()}`,
      ticket_id: ticket.id,
      event_id: targetEventId,
      user_id: ticket.user_id,
      checked_in_by: operatorUserId || 'op-system',
      checked_in_at: new Date().toISOString(),
      device_info: deviceInfo || 'Dashboard Web Scanner',
    };

    return {
      success: true,
      code: 'CHECKIN_SUCCESS',
      message: 'Check-in Verified Successfully!',
      checkin: newCheckin,
      attendeeName: ticket.user?.full_name || 'Verified Attendee',
      eventName: ticket.event?.title || 'Social Scene Event',
    };
  }
}
