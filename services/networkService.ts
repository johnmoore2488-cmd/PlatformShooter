import { NetworkPacket } from "../types";

export class NetworkService {
  private channel: BroadcastChannel | null = null;
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
  }
}