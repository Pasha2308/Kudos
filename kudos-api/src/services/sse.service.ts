import { Response } from 'express';

export class SSEService {
  private static clients = new Map<string, Set<Response>>();

  static addClient(userId: string, res: Response) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);
  }

  static removeClient(userId: string, res: Response) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  static broadcast(type: string, message: any) {
    for (const [userId, userClients] of this.clients.entries()) {
      for (const client of userClients) {
        client.write(`data: ${JSON.stringify({ type, message })}\n\n`);
      }
    }
  }

  static emitToUser(userId: string, type: string, message: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      for (const client of userClients) {
        client.write(`data: ${JSON.stringify({ type, message })}\n\n`);
      }
    }
  }

  static getClientCount() {
    let total = 0;
    for (const clients of this.clients.values()) {
      total += clients.size;
    }
    return total;
  }
}
