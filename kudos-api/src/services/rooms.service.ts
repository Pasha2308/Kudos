import { db, firestoreReady } from '../config/firebase';

export interface Room {
  id: string;
  name: string;
  emoji: string;
  description: string;
  memberCount: number;
  activeCount: number;
  createdAt: Date;
  closesAt: Date; // 30 days from creation
  createdBy: string;
  tags: string[];
  isEphemeral: boolean; // always true — rooms close after 30 days
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

const MOCK_ROOMS: Room[] = [
  {
    id: 'room_midnight_builders',
    name: 'Midnight Builders',
    emoji: '🌙',
    description: 'Solo founders who build at night when the world is quiet.',
    memberCount: 6,
    activeCount: 2,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    closesAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    createdBy: 'system',
    tags: ['builders', 'solo', 'night'],
    isEphemeral: true,
  },
  {
    id: 'room_founders_failed',
    name: 'Founders Who Failed',
    emoji: '🔥',
    description: 'A safe space for people who have shipped, broken, and learned.',
    memberCount: 4,
    activeCount: 1,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    closesAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    createdBy: 'system',
    tags: ['founders', 'failure', 'lessons'],
    isEphemeral: true,
  },
  {
    id: 'room_overthinkers',
    name: 'Overthinkers Club',
    emoji: '💭',
    description: 'People who process life through long conversations and late nights.',
    memberCount: 7,
    activeCount: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    closesAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    createdBy: 'system',
    tags: ['deep', 'thinkers', 'conversations'],
    isEphemeral: true,
  },
  {
    id: 'room_builders_midnight',
    name: 'Builders at Midnight',
    emoji: '🎯',
    description: 'Solo founders working on hard problems in the quiet hours.',
    memberCount: 5,
    activeCount: 0,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    closesAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    createdBy: 'system',
    tags: ['builders', 'problems', 'execution'],
    isEphemeral: true,
  },
];

export class RoomsService {

  /**
   * Returns all available rooms, with membership status for the user
   */
  static async getRooms(userId: string): Promise<{
    userRooms: Room[];
    suggestedRooms: Room[];
  }> {
    if (!firestoreReady) {
      return {
        userRooms: MOCK_ROOMS.slice(0, 2),
        suggestedRooms: MOCK_ROOMS.slice(2),
      };
    }

    try {
      // Get rooms user is in
      const membershipSnap = await db.collection('users').doc(userId)
        .collection('roomMemberships').get();
      const memberRoomIds = new Set(membershipSnap.docs.map(d => d.id));

      // Get all rooms
      const roomsSnap = await db.collection('rooms')
        .where('closesAt', '>', new Date())
        .orderBy('closesAt')
        .limit(20)
        .get();

      const allRooms = roomsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];

      return {
        userRooms: allRooms.filter(r => memberRoomIds.has(r.id)),
        suggestedRooms: allRooms.filter(r => !memberRoomIds.has(r.id)),
      };
    } catch (e) {
      console.error('[Rooms] Error fetching rooms:', e);
      return {
        userRooms: MOCK_ROOMS.slice(0, 2),
        suggestedRooms: MOCK_ROOMS.slice(2),
      };
    }
  }

  /**
   * Join a room
   */
  static async joinRoom(userId: string, roomId: string): Promise<{ success: boolean }> {
    if (firestoreReady) {
      try {
        await db.collection('users').doc(userId)
          .collection('roomMemberships').doc(roomId).set({
            joinedAt: new Date(),
            roomId,
          });

        // Increment member count
        await db.collection('rooms').doc(roomId).update({
          memberCount: db.collection('rooms').doc(roomId).get().then(d => (d.data()?.memberCount || 0) + 1)
        });
      } catch (e) {
        console.error('[Rooms] Error joining room:', e);
      }
    }
    return { success: true };
  }

  /**
   * Get messages for a room
   */
  static async getRoomMessages(roomId: string, limit = 50): Promise<RoomMessage[]> {
    if (!firestoreReady) {
      return [
        {
          id: 'mock_msg_1',
          roomId,
          userId: 'mock_priya',
          userName: 'Priya',
          content: 'Anyone else ship something at 2am and then immediately regret it? 😅',
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: 'mock_msg_2',
          roomId,
          userId: 'mock_arjun',
          userName: 'Arjun',
          content: 'Every single time. But then it works and you feel like a genius.',
          timestamp: new Date(Date.now() - 3000000),
        },
      ];
    }

    try {
      const snap = await db.collection('rooms').doc(roomId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snap.docs.map((d: any) => ({
        id: d.id,
        ...d.data()
      } as RoomMessage)).reverse();
    } catch (e) {
      console.error('[Rooms] Error fetching messages:', e);
      return [];
    }
  }

  /**
   * Send a message to a room
   */
  static async sendRoomMessage(
    roomId: string,
    userId: string,
    userName: string,
    content: string
  ): Promise<{ success: boolean; messageId: string }> {
    const messageId = `msg_${Date.now()}`;

    if (firestoreReady) {
      try {
        await db.collection('rooms').doc(roomId)
          .collection('messages').doc(messageId).set({
            userId,
            userName,
            content,
            timestamp: new Date(),
            roomId,
          });
      } catch (e) {
        console.error('[Rooms] Error sending message:', e);
      }
    }

    return { success: true, messageId };
  }

  /**
   * Create a new room
   */
  static async createRoom(
    userId: string,
    data: { name: string; emoji: string; description: string; tags: string[] }
  ): Promise<Room> {
    const now = new Date();
    const closesAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const room: Room = {
      id: `room_${Date.now()}`,
      name: data.name,
      emoji: data.emoji || '🌙',
      description: data.description,
      memberCount: 1,
      activeCount: 1,
      createdAt: now,
      closesAt,
      createdBy: userId,
      tags: data.tags || [],
      isEphemeral: true,
    };

    if (firestoreReady) {
      try {
        await db.collection('rooms').doc(room.id).set(room);
        await db.collection('users').doc(userId)
          .collection('roomMemberships').doc(room.id).set({
            joinedAt: now,
            roomId: room.id,
          });
      } catch (e) {
        console.error('[Rooms] Error creating room:', e);
      }
    }

    return room;
  }

  /**
   * Get days remaining for a room
   */
  static getDaysRemaining(closesAt: Date): number {
    const ms = new Date(closesAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }
}
