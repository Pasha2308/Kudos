import { Response } from 'express';

export class SSEService {
  private static clients = new Set<Response>();

  static addClient(res: Response) {
    this.clients.add(res);
  }

  static removeClient(res: Response) {
    this.clients.delete(res);
  }

  static broadcast(type: string, message: any) {
    for (const client of this.clients) {
      client.write(`data: ${JSON.stringify({ type, message })}\n\n`);
    }
  }

  static getClientCount() {
    return this.clients.size;
  }
}
