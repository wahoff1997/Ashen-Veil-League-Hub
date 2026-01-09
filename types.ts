
import React from 'react';

export enum View {
  Home = 'Home',
  Dorm = 'Dorm',
  LeagueFinder = 'LeagueFinder',
  Profile = 'Profile',
  Characters = 'Characters',
  Echo = 'Echo',
  Journal = 'Journal',
  Trophies = 'Trophies',
  Archive = 'Archive',
  History = 'History',
  Trader = 'Trader',
  Broker = 'Broker',
  Vault = 'Vault',
  ChronoScribe = 'ChronoScribe'
}

export interface User {
  id: string;
  username: string;
  email: string;
  thoughtEssence: number;
  avatar?: string;
  isOnline: boolean;
  leagues: League[];
  friends: Friend[];
  dormBackground?: string;
}

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
}

export interface League {
  id: string;
  name: string;
  memberCount: number;
  platform: string;
  role: 'Leader' | 'Member';
  description?: string;
  logo?: string;
  banner?: string;
  background?: string;
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  image: string;
  earnedBy: string[];
}

export interface LoreItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface ArmorSuit {
  id: string;
  title: string;
  description: string;
  image: string;
  modelUrl?: string;
  stats: {
    power: number;
    defense: number;
    health: number;
    vitalization: number;
  };
}

export interface MirrorAsset {
  id: string;
  type: 'image' | 'model';
  url: string;
  name: string;
  timestamp: Date;
}

export interface DormItem {
  id: string;
  type: 'trophy_case' | 'lore_chest' | 'crystal_ball' | 'journal' | 'armory' | 'mirror' | 'piggy_bank';
  x: number;
  y: number;
  title: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  channel: 'league' | 'member' | 'global' | 'sos';
}

export interface SOSRequest {
  id: string;
  requestorId: string;
  requestorName: string;
  title: string;
  description: string;
  amount: number;
  status: 'open' | 'accepted' | 'completed' | 'cancelled' | 'expired';
  helperId?: string;
  helperName?: string;
  timestamp: Date;
}

export interface Assignment {
  id: string;
  leaderId: string;
  leaderName: string;
  assigneeId: string;
  assigneeName: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'completed';
  timestamp: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
}

export interface BrokerSale {
  id: string;
  sellerName: string;
  itemName: string;
  price: number;
  timestamp: Date;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
      [elemName: string]: any;
    }
  }
}
