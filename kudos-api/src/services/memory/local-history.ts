import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), '.local-history.json');

export class LocalHistory {
  static getHistory(): any[] {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        const history = JSON.parse(data);
        // Convert string timestamps back to Date objects
        return history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        }));
      }
    } catch (e) {
      console.error('[LocalHistory] Read error:', e);
    }
    return [];
  }

  static saveHistory(history: any[]) {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
    } catch (e) {
      console.error('[LocalHistory] Write error:', e);
    }
  }

  static addMessage(msg: any) {
    const history = this.getHistory();
    history.push(msg);
    if (history.length > 200) {
      history.splice(0, history.length - 200);
    }
    this.saveHistory(history);
  }
}
