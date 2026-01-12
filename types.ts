
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

export interface NewsArticle {
  id: string;
  leagueId: string;
  title: string;
  category: 'Raid' | 'Recruitment' | 'Achievement' | 'Announcement' | 'Tournament';
  content: string;
  author: string;
  timestamp: string;
  imageUrl?: string;
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
