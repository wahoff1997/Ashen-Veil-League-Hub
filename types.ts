// types.ts

export type UUID = string;
export type ClerkID = string;

export enum View {
  Home = "Home",
  Dorm = "Dorm",
  LeagueFinder = "LeagueFinder",
  Profile = "Profile",
  Characters = "Characters",
  Echo = "Echo",
  Journal = "Journal",
  Trophies = "Trophies",
  Archive = "Archive",
  History = "History",
  Trader = "Trader",
  Broker = "Broker",
  Vault = "Vault",
  ChronoScribe = "ChronoScribe"
}

export type NewsCategory =
  | "Raid"
  | "Recruitment"
  | "Achievement"
  | "Announcement"
  | "Tournament";

export interface NewsArticle {
  id: UUID;
  leagueId: UUID;
  title: string;
  category: NewsCategory;
  content: string;
  author: string;
  createdAt: string; // ISO timestamp
  imageUrl?: string;
}

export interface User {
  id: ClerkID;
  username: string;
  email: string;
  thoughtEssence: number;
  avatar?: string;
  dormBackground?: string;



