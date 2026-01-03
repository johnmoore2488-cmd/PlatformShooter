import { NetworkPacket } from "../types";

export class NetworkService {
  private channel: BroadcastChannel | null = null;
  private discoveryChannel: BroadcastChannel | null = null;
  private onPacket: (packet: NetworkPacket) => void;
  public id: string;

  constructor(onPacket: (packet: NetworkPacket) => void) {
    this.onPacket = onPacket;
    this.id = Math.random().toString(36).substring(7);
  }

  connect(roomId: string) {
    if (this.channel) {
      this.channel.close();
    }
    this.channel = new BroadcastChannel(`neon-rift-${roomId}`);
    this.channel.onmessage = (ev) => {
      const packet = ev.data as NetworkPacket;
      if (packet.senderId !== this.id) {
        this.onPacket(packet);
      }
    };
    this.send({ type: 'JOIN', payload: { name: 'Player' } });
  }

  enableDiscovery(roomId: string) {
    if (this.discoveryChannel) return;
    
    this.discoveryChannel = new BroadcastChannel('neon-rift-discovery');
    
    // Listen for queries
    this.discoveryChannel.onmessage = (ev) => {
      if (ev.data && ev.data.type === 'QUERY') {
        // Respond that we exist
        this.discoveryChannel?.postMessage({ type: 'ANNOUNCE', roomId });
      }
    };

    // Also announce immediately so anyone currently scanning sees us
    this.discoveryChannel.postMessage({ type: 'ANNOUNCE', roomId });
  }

  send(packet: Omit<NetworkPacket, 'senderId'>) {
    if (this.channel) {
      this.channel.postMessage({ ...packet, senderId: this.id });
    }
  }

  disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.discoveryChannel) {
      this.discoveryChannel.close();
      this.discoveryChannel = null;
    }
  }

  // Static method to scan for rooms without creating a full service instance
  static scan(onRoomFound: (roomId: string) => void): () => void {
    const channel = new BroadcastChannel('neon-rift-discovery');
    
    channel.onmessage = (ev) => {
      if (ev.data && ev.data.type === 'ANNOUNCE') {
        onRoomFound(ev.data.roomId);
      }
    };

    // Send initial query
    channel.postMessage({ type: 'QUERY' });

    // Periodically query to keep list fresh or find new rooms
    const interval = setInterval(() => {
      channel.postMessage({ type: 'QUERY' });
    }, 3000);

    return () => {
      clearInterval(interval);
      channel.close();
    };
  }
}