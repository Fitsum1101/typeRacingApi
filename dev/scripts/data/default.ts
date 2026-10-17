import { Difficulty } from "../../../src/generated/prisma/enums";

const USERS_DATA = [
  {
    username: "alice",
    email: "alice@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
  },
  {
    username: "bob",
    email: "bob@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
  },
  {
    username: "charlie",
    email: "charlie@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
  },
  {
    username: "diana",
    email: "diana@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
  },
  {
    username: "erik",
    email: "erik@example.com",
    avatar: null,
  },
];

const USER_STATS_DATA = [
  {
    totalRaces: 42,
    racesWon: 18,
    totalPoints: 1250,
    bestWpm: 98.5,
    averageWpm: 72.3,
    averageAccuracy: 94.2,
  },
  {
    totalRaces: 35,
    racesWon: 12,
    totalPoints: 980,
    bestWpm: 85.0,
    averageWpm: 68.1,
    averageAccuracy: 91.5,
  },
  {
    totalRaces: 28,
    racesWon: 9,
    totalPoints: 720,
    bestWpm: 79.2,
    averageWpm: 61.4,
    averageAccuracy: 89.8,
  },
  {
    totalRaces: 15,
    racesWon: 5,
    totalPoints: 410,
    bestWpm: 71.0,
    averageWpm: 55.6,
    averageAccuracy: 92.1,
  },
  {
    totalRaces: 8,
    racesWon: 1,
    totalPoints: 150,
    bestWpm: 58.3,
    averageWpm: 47.9,
    averageAccuracy: 86.4,
  },
];

const TYPING_TEXTS_DATA = [
  {
    content:
      "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
    difficulty: Difficulty.EASY,
    category: "pangram",
    language: "en",
  },
  {
    content:
      "In the heart of the ancient forest, where sunlight filtered through the dense canopy, a small stream wound its way between moss-covered stones. Birds sang from the branches above while the wind whispered secrets through the leaves.",
    difficulty: Difficulty.MEDIUM,
    category: "nature",
    language: "en",
  },
  {
    content:
      "Quantum computing leverages the principles of superposition and entanglement to process information in ways classical computers cannot. Qubits can exist in multiple states simultaneously, enabling exponential speedups for certain algorithms such as Shor's factoring and Grover's search.",
    difficulty: Difficulty.HARD,
    category: "science",
    language: "en",
  },
  {
    content:
      "She sold seashells by the seashore. The shells she sold were surely seashells. So if she sold shells on the seashore, I'm sure she sold seashore shells.",
    difficulty: Difficulty.MEDIUM,
    category: "tongue-twister",
    language: "en",
  },
  {
    content:
      "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles and by opposing end them.",
    difficulty: Difficulty.HARD,
    category: "literature",
    language: "en",
  },
  {
    content: "Hello world. This is a simple typing test for beginners.",
    difficulty: Difficulty.EASY,
    category: "basic",
    language: "en",
  },
];

export { USERS_DATA, USER_STATS_DATA, TYPING_TEXTS_DATA };
