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
  createdAt: string;
  imageUrl?: string;
}

export interface User {
  id: ClerkID;
  username: string;
  email: string;
  thoughtEssence: number;
  avatar?: string;
  dormBackground?: string;
}

export interface Friend {
  id: ClerkID;
  username: string;
  avatar?: string;
}

export interface League {
  id: UUID;
  name: string;
  platform: string;
  description?: string;
  logo?: string;
  banner?: string;
  background?: string;
}

export interface LeagueMember {
  id: UUID;
  leagueId: UUID;
  userId: ClerkID;
  role: "Leader" | "Member";
}

export interface Trophy {
  id: UUID;
  title: string;
  description: string;
  image: string;
}

export interface UserTrophy {
  id: UUID;
  userId: ClerkID;
  trophyId: UUID;
  earnedAt: string;
}

export interface UserWithRelations extends User {
  leagues: League[];
  friends: Friend[];
  trophies: Trophy[];
}

