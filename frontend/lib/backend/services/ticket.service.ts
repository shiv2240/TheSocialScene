import { Ticket, TicketStatus } from '../types/database.types';

export class TicketService {
  /**
   * Format unique ticket code with standard prefix
   * Example: TSS-2026-A8F3B91C
   */
  static generateTicketCode(): string {
    const randomHex = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    )
      .join('')
      .toUpperCase();
    return `TSS-2026-${randomHex}`;
  }

  /**
   * Validate ticket QR payload securely without exposing raw auth tokens
   */
  static verifyQrPayload(qrPayload: string): { isValid: boolean; ticketCode?: string } {
    if (!qrPayload || !qrPayload.startsWith('TSS-2026-')) {
      return { isValid: false };
    }
    return { isValid: true, ticketCode: qrPayload.trim() };
  }

  /**
   * Mock tickets helper for local development / testing
   */
  static getMockTickets(): Ticket[] {
    return [
      {
        id: 'tkt-001',
        ticket_code: 'TSS-2026-9B4A7C2E',
        registration_id: 'reg-001',
        event_id: 'evt-001',
        user_id: 'usr-100',
        qr_payload: 'TSS-2026-9B4A7C2E',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
}
