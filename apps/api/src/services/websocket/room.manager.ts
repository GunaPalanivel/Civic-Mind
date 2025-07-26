import { logger } from "@/utils/logger";

interface RoomMember {
  socketId: string;
  userId?: string;
  joinedAt: number;
  region: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface Room {
  id: string;
  region: string;
  members: Map<string, RoomMember>;
  createdAt: number;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRooms: Map<string, Set<string>> = new Map();

  // Subscribe socket to a region-based room
  async subscribeToRegion(
    socketId: string,
    region: string,
    userId?: string,
    coordinates?: { latitude: number; longitude: number },
  ): Promise<void> {
    try {
      const roomId = `region:${region}`;

      // Get or create room
      let room = this.rooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          region,
          members: new Map(),
          createdAt: Date.now(),
        };
        this.rooms.set(roomId, room);
        logger.info(`Created new room: ${roomId}`);
      }

      // Add member to room
      const member: RoomMember = {
        socketId,
        userId,
        joinedAt: Date.now(),
        region,
        coordinates,
      };

      room.members.set(socketId, member);

      // Track socket's rooms
      if (!this.socketToRooms.has(socketId)) {
        this.socketToRooms.set(socketId, new Set());
      }
      this.socketToRooms.get(socketId)!.add(roomId);

      // Update room bounds if coordinates provided
      if (coordinates) {
        this.updateRoomBounds(room, coordinates);
      }

      logger.info(`Socket ${socketId} subscribed to region ${region}`, {
        roomId,
        memberCount: room.members.size,
        userId,
      });
    } catch (error) {
      logger.error("Failed to subscribe to region:", error);
      throw error;
    }
  }

  // Get rooms that should receive alerts for a specific location
  getRoomsForLocation(location: {
    latitude: number;
    longitude: number;
    region?: string;
  }): string[] {
    const targetRooms: string[] = [];

    for (const [roomId, room] of this.rooms) {
      // Direct region match
      if (location.region && room.region === location.region) {
        targetRooms.push(roomId);
        continue;
      }

      // Geographic bounds check
      if (room.bounds && this.isLocationInBounds(location, room.bounds)) {
        targetRooms.push(roomId);
        continue;
      }

      // Proximity check for members with coordinates
      if (this.hasNearbyMembers(room, location, 10000)) {
        // 10km radius
        targetRooms.push(roomId);
      }
    }

    logger.debug(`Found ${targetRooms.length} rooms for location`, {
      location,
      rooms: targetRooms,
    });

    return targetRooms;
  }

  // Remove socket from all rooms
  removeFromAllRooms(socketId: string): void {
    const socketRooms = this.socketToRooms.get(socketId);
    if (!socketRooms) return;

    let removedFromCount = 0;

    for (const roomId of socketRooms) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.members.delete(socketId);
        removedFromCount++;

        // Clean up empty rooms
        if (room.members.size === 0) {
          this.rooms.delete(roomId);
          logger.debug(`Cleaned up empty room: ${roomId}`);
        }
      }
    }

    this.socketToRooms.delete(socketId);

    logger.info(`Socket ${socketId} removed from ${removedFromCount} rooms`);
  }

  // Get room statistics
  getRoomStats(): {
    totalRooms: number;
    totalMembers: number;
    roomDetails: Array<{
      roomId: string;
      region: string;
      memberCount: number;
      ageMinutes: number;
    }>;
  } {
    const now = Date.now();
    const roomDetails = Array.from(this.rooms.values()).map((room) => ({
      roomId: room.id,
      region: room.region,
      memberCount: room.members.size,
      ageMinutes: Math.round((now - room.createdAt) / 60000),
    }));

    return {
      totalRooms: this.rooms.size,
      totalMembers: Array.from(this.rooms.values()).reduce(
        (sum, room) => sum + room.members.size,
        0,
      ),
      roomDetails,
    };
  }

  private updateRoomBounds(
    room: Room,
    coordinates: { latitude: number; longitude: number },
  ): void {
    if (!room.bounds) {
      room.bounds = {
        minLat: coordinates.latitude,
        maxLat: coordinates.latitude,
        minLng: coordinates.longitude,
        maxLng: coordinates.longitude,
      };
    } else {
      room.bounds.minLat = Math.min(room.bounds.minLat, coordinates.latitude);
      room.bounds.maxLat = Math.max(room.bounds.maxLat, coordinates.latitude);
      room.bounds.minLng = Math.min(room.bounds.minLng, coordinates.longitude);
      room.bounds.maxLng = Math.max(room.bounds.maxLng, coordinates.longitude);
    }
  }

  private isLocationInBounds(
    location: { latitude: number; longitude: number },
    bounds: Room["bounds"],
  ): boolean {
    if (!bounds) return false;

    return (
      location.latitude >= bounds.minLat &&
      location.latitude <= bounds.maxLat &&
      location.longitude >= bounds.minLng &&
      location.longitude <= bounds.maxLng
    );
  }

  private hasNearbyMembers(
    room: Room,
    location: { latitude: number; longitude: number },
    radiusMeters: number,
  ): boolean {
    for (const member of room.members.values()) {
      if (member.coordinates) {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          member.coordinates.latitude,
          member.coordinates.longitude,
        );

        if (distance <= radiusMeters) {
          return true;
        }
      }
    }
    return false;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
