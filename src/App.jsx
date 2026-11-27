import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
} from 'firebase/firestore';
import {
  Castle,
  Shield,
  Coins,
  ScrollText,
  Sparkles,
  Hammer,
  Users,
  Plus,
  Trash2,
  ArrowUpCircle,
  Dices,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Download,
  Upload,
  Crown,
  Compass,
  Wrench,
  Eye,
  Lock,
  Unlock,
  ChevronDown,
  Clock,
  MapPin,
  FileText,
  X,
  Check,
  Search,
  Building2,
  Flame,
  Calendar,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  UserCheck,
  Share2,
  Copy,
  FolderPlus,
  Swords,
  Globe,
  KeyRound,
  Mail,
  ArrowLeft,
} from 'lucide-react';

// ============================================================================
// FIREBASE INITIALIZATION (MANDATORY ENVIRONMENT CONFIG)
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBuXd3C9VpEh2hPLab8ixtus9L-k3knGZ4",
  authDomain: "adam-s-bastion-app.firebaseapp.com",
  projectId: "adam-s-bastion-app",
  storageBucket: "adam-s-bastion-app.firebasestorage.app",
  messagingSenderId: "811236203574",
  appId: "1:811236203574:web:e0e175e65f0b29cd7b8c97"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ============================================================================
// 2024 DUNGEON MASTER'S GUIDE (D&D 5.5e) BASTION DATABASE & RULES CONSTANTS
// ============================================================================

const SPACE_SPECS = {
  Cramped: {
    name: 'Cramped',
    squares: 4,
    sqFt: 100,
    buildCost: 500,
    buildDays: 20,
    nextSize: 'Roomy',
    enlargeCost: 500,
    enlargeDays: 25,
    color: 'text-amber-300 border-amber-500/40 bg-amber-950/30',
  },
  Roomy: {
    name: 'Roomy',
    squares: 16,
    sqFt: 400,
    buildCost: 1000,
    buildDays: 45,
    nextSize: 'Vast',
    enlargeCost: 2000,
    enlargeDays: 80,
    color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30',
  },
  Vast: {
    name: 'Vast',
    squares: 36,
    sqFt: 900,
    buildCost: 3000,
    buildDays: 125,
    nextSize: null,
    enlargeCost: 0,
    enlargeDays: 0,
    color: 'text-purple-300 border-purple-500/40 bg-purple-950/30',
  },
};

const BASIC_FACILITY_TYPES = [
  { id: 'bedroom', name: 'Bedroom', desc: 'Comfortable private sleeping quarters for the Bastion owner or honored guests.' },
  { id: 'dining_room', name: 'Dining Room', desc: 'A hall with tables and hearths for feasts, councils, and daily meals.' },
  { id: 'parlor', name: 'Parlor', desc: 'A welcoming reception room for entertaining visitors and discussing affairs.' },
  { id: 'courtyard', name: 'Courtyard', desc: 'An open-air walled yard for drills, fresh air, or staging wagons.' },
  { id: 'kitchen', name: 'Kitchen', desc: 'Hearths, ovens, and pantry prep space to keep the Bastion well-fed.' },
  { id: 'storage', name: 'Storage', desc: 'Dry cellars or lofts for mundane supplies, crates, and rations.' },
  { id: 'washroom', name: 'Washroom', desc: 'Bathing tubs, privies, and heated water basins for hygiene.' },
];

const SPECIAL_FACILITIES_CATALOG = [
  // LEVEL 5
  {
    id: 'arcane_study',
    name: 'Arcane Study',
    level: 5,
    space: 'Roomy',
    prerequisite: 'Ability to use an Arcane Focus or tool as a Spellcasting Focus',
    hirelings: 1,
    orders: ['Craft'],
    canEnlarge: false,
    charm: 'Charm of Darkvision or Identify (after Long Rest)',
    summary: 'Craft Arcana-based magic items (Common/Uncommon) or Spell Scrolls. Long Rest grants a minor arcane charm.',
  },
  {
    id: 'armory',
    name: 'Armory',
    level: 5,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Trade'],
    canEnlarge: false,
    charm: 'Bastion Defenders roll 1d8 instead of 1d6 when defending against attacks',
    summary: 'Stockpiles weapons and armor. Spend 100 GP (+100 GP per Barrack) to equip Defenders, upgrading their casualty die from d6 to d8.',
  },
  {
    id: 'barrack',
    name: 'Barrack',
    level: 5,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Recruit'],
    canEnlarge: true,
    enlargeDesc: 'Enlarge to Vast (2,000 GP): Houses up to 25 Bastion Defenders instead of 12.',
    summary: 'Houses up to 12 Bastion Defenders (25 if Vast). Recruit order adds up to 4 trained Defenders at no GP cost.',
  },
  {
    id: 'garden',
    name: 'Garden',
    level: 5,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Harvest'],
    canEnlarge: true,
    enlargeDesc: 'Enlarge to Vast (2,000 GP): Gain the benefits of two Gardens simultaneously.',
    summary: 'Cultivate Decorative, Food, Herb, or Poison plots. Harvest yields 10 rations, 1 Potion of Healing, Antitoxin, or Basic Poison.',
  },
  {
    id: 'library',
    name: 'Library',
    level: 5,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Research'],
    canEnlarge: true,
    enlargeDesc: 'Enlarge to Vast (2,000 GP): Gain 2 hirelings and research two topics per order.',
    summary: 'Contains reference volumes. Research order uncovers up to 3 accurate pieces of lore about a legend, person, or place.',
  },
  {
    id: 'sanctuary',
    name: 'Sanctuary',
    level: 5,
    space: 'Roomy',
    prerequisite: 'Ability to use a Holy Symbol or Druidic Focus as a Spellcasting Focus',
    hirelings: 1,
    orders: ['Craft'],
    canEnlarge: false,
    charm: 'Charm of Vitality (after Long Rest)',
    summary: 'Craft a Sacred Focus or Healing-aligned items. Long Rest grants a blessing of restoration and vitality.',
  },
  {
    id: 'smithy',
    name: 'Smithy',
    level: 5,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 2,
    orders: ['Craft'],
    canEnlarge: false,
    summary: 'Forge mundane arms/armor or craft Common/Uncommon magic armaments and ammunition with Smith’s Tools.',
  },
  {
    id: 'storehouse',
    name: 'Storehouse',
    level: 5,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Trade'],
    canEnlarge: false,
    summary: 'Buy nonmagical trade goods (up to 500 GP at L5, 2,000 GP at L9, 5,000 GP at L13) and sell them for +10% to +100% profit.',
  },
  {
    id: 'workshop',
    name: 'Workshop',
    level: 5,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 3,
    orders: ['Craft'],
    canEnlarge: true,
    enlargeDesc: 'Enlarge to Vast (2,000 GP): Gain 2 additional hirelings (5 total) and broader Artisan tool coverage.',
    summary: 'Equipped with six sets of Artisan’s Tools. Craft adventuring gear, masterwork items, or magic implements; grants Heroic Inspiration after working.',
  },

  // LEVEL 9
  {
    id: 'gaming_hall',
    name: 'Gaming Hall',
    level: 9,
    space: 'Vast',
    prerequisite: 'None',
    hirelings: 4,
    orders: ['Trade'],
    canEnlarge: false,
    summary: 'Run a gambling den for 7 days. Roll d100 to earn 1d6 × 10 GP up to 10d6 × 10 GP in house winnings.',
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    level: 9,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Harvest'],
    canEnlarge: false,
    summary: 'Glass enclosure for rare flora. Harvest a Potion of Greater Healing or one of three magical herbal poisons/elixirs; offers daily healing fruit.',
  },
  {
    id: 'laboratory',
    name: 'Laboratory',
    level: 9,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Craft'],
    canEnlarge: false,
    summary: 'Alchemical distillers and reagents. Craft Alchemist’s Supplies items, Potions of Healing, or rare poisons/elixirs.',
  },
  {
    id: 'sacristy',
    name: 'Sacristy',
    level: 9,
    space: 'Roomy',
    prerequisite: 'Ability to use a Holy Symbol or Druidic Focus',
    hirelings: 1,
    orders: ['Craft'],
    canEnlarge: false,
    summary: 'Prepare Holy Water (up to 5 flasks) or craft divine relics/magic items (up to Rare). Regain expended spell slots on a Short Rest here.',
  },
  {
    id: 'scriptorium',
    name: 'Scriptorium',
    level: 9,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Craft'],
    canEnlarge: false,
    summary: 'Transcribe Spell Scrolls, copy spellbooks, or produce 50 crisp pamphlets/forgeries at half normal crafting time.',
  },
  {
    id: 'stable',
    name: 'Stable',
    level: 9,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Trade'],
    canEnlarge: true,
    enlargeDesc: 'Enlarge to Vast (2,000 GP): Houses up to 6 Large beasts instead of 3.',
    summary: 'Houses 3 Large mounts (6 if Vast). Buy and sell Riding Horses, Warhorses, or Ponies at a +20% markup (rising with level).',
  },
  {
    id: 'teleportation_circle',
    name: 'Teleportation Circle',
    level: 9,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Recruit'],
    canEnlarge: false,
    summary: 'Permanent Teleportation Circle sigil. Recruit order invites a friendly spellcaster who can cast one Wizard spell (up to 4th level; 8th at L17) for you.',
  },
  {
    id: 'theater',
    name: 'Theater',
    level: 9,
    space: 'Vast',
    prerequisite: 'None',
    hirelings: 4,
    orders: ['Empower'],
    canEnlarge: false,
    summary: 'Stage plays and concerts. Empower order grants you and allies Theater Dice (d6; d8 at L13; d10 at L17) to add to any d20 test.',
  },
  {
    id: 'training_area',
    name: 'Training Area',
    level: 9,
    space: 'Vast',
    prerequisite: 'None',
    hirelings: 4,
    orders: ['Empower'],
    canEnlarge: false,
    summary: 'Sparring grounds with expert instructors. Empower order grants an 8-hour combat boon (Extra unarmed/weapon damage, AC bonus, or skill mastery).',
  },
  {
    id: 'trophy_room',
    name: 'Trophy Room',
    level: 9,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Research'],
    canEnlarge: false,
    summary: 'Displays monster relics and curios. Research lore on creatures or locate a Common/Uncommon trinket/magic item.',
  },

  // LEVEL 13
  {
    id: 'archive',
    name: 'Archive',
    level: 13,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Research'],
    canEnlarge: true,
    enlargeDesc: 'Enlarge to Vast (2,000 GP): Gain 2 additional reference books (+2 to additional INT checks).',
    summary: 'Vault of rare manuscripts and planar codices. Research casts Legend Lore; reference books grant +2 to Arcana, History, Investigation, Nature, or Religion.',
  },
  {
    id: 'meditation_chamber',
    name: 'Meditation Chamber',
    level: 13,
    space: 'Cramped',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Empower'],
    canEnlarge: false,
    summary: 'Tranquil sanctum of inner focus. Empower grants Fortify Self (Advantage on 2 types of saving throws for 7 days).',
  },
  {
    id: 'menagerie',
    name: 'Menagerie',
    level: 13,
    space: 'Vast',
    prerequisite: 'None',
    hirelings: 2,
    orders: ['Recruit'],
    canEnlarge: false,
    summary: 'Enclosures for exotic creatures. Recruit beasts or monstrosities (up to CR 3) to serve as Bastion Defenders (each worth 4 Defenders!).',
  },
  {
    id: 'observatory',
    name: 'Observatory',
    level: 13,
    space: 'Roomy',
    prerequisite: 'Ability to use a Spellcasting Focus',
    hirelings: 1,
    orders: ['Empower'],
    canEnlarge: false,
    summary: 'Telescope peering into Wildspace and the Astral Sea. Empower grants Eldritch Discovery (cast Contact Other Plane + Charm of Darkvision/Heroism/Vitality).',
  },
  {
    id: 'pub',
    name: 'Pub',
    level: 13,
    space: 'Roomy',
    prerequisite: 'None',
    hirelings: 1,
    orders: ['Research'],
    canEnlarge: true,
    enlargeDesc: 'Enlarge to Vast (2,000 GP): Gain 3 additional bartenders/servers (4 total) and wider spy coverage.',
    summary: 'Bustling tavern with a spy network. Research gathers rumors within 10 miles; serves magical brews granting Darkvision, Resistance, or Spider Climb.',
  },
  {
    id: 'reliquary',
    name: 'Reliquary',
    level: 13,
    space: 'Cramped',
    prerequisite: 'Ability to use a Holy Symbol or Druidic Focus',
    hirelings: 1,
    orders: ['Harvest'],
    canEnlarge: false,
    summary: 'Houses a sacred relic. Harvest produces a Talisman that lets you cast Greater Restoration once with no material components.',
  },

  // LEVEL 17
  {
    id: 'demiplane',
    name: 'Demiplane',
    level: 17,
    space: 'Vast',
    prerequisite: 'Ability to use an Arcane Focus or tool as a Spellcasting Focus',
    hirelings: 1,
    orders: ['Empower'],
    canEnlarge: false,
    summary: 'Extradimensional vault behind a magical door. Empower grants Arcane Resilience (+5 × Prof Bonus Temp HP after a Long Rest for 7 days).',
  },
  {
    id: 'guildhall',
    name: 'Guildhall',
    level: 17,
    space: 'Vast',
    prerequisite: 'Expertise in a skill',
    hirelings: 1,
    orders: ['Recruit'],
    canEnlarge: false,
    summary: 'Headquarters of a renowned guild (Adventurers, Bakers, Brewers, Masons, Smiths, Thieves). Recruit sends guild agents to complete a special assignment.',
  },
  {
    id: 'sanctum',
    name: 'Sanctum',
    level: 17,
    space: 'Roomy',
    prerequisite: 'Ability to use a Holy Symbol or Druidic Focus',
    hirelings: 4,
    orders: ['Empower'],
    canEnlarge: false,
    summary: 'Radiant seat of divine power. Empower grants Fortifying Rites (cast Heal daily + permanent Word of Recall sanctuary anchor).',
  },
  {
    id: 'war_room',
    name: 'War Room',
    level: 17,
    space: 'Vast',
    prerequisite: 'Fighting Style feature or Unarmored Defense feature',
    hirelings: 2,
    orders: ['Recruit'],
    canEnlarge: false,
    summary: 'Command council of veteran lieutenants. Recruit musters an army of 100 Guards (plus mounts/siege gear if you have Stables/Smithy) for a campaign.',
  },
];

// Official 2024 DMG Bastion Events Table (d100)
const BASTION_EVENTS_TABLE = [
  {
    min: 1,
    max: 50,
    title: 'All Is Well',
    severity: 'neutral',
    summary: 'Nothing significant occurs at your Bastion. The hirelings maintain the grounds smoothly and await your return.',
    effectType: 'none',
  },
  {
    min: 51,
    max: 55,
    title: 'Attack!',
    severity: 'danger',
    summary: 'A hostile force assaults your Bastion! Roll 6d6 (or 6d8 if you have a stocked Armory). Each "1" rolled causes 1 Bastion Defender to be lost. If you have 0 Defenders, one Special Facility is damaged and shut down.',
    effectType: 'attack',
  },
  {
    min: 56,
    max: 58,
    title: 'Criminal Hireling',
    severity: 'warning',
    summary: 'One of your hirelings has a criminal past and officials arrive with a warrant. You can surrender the hireling (facility shuts down for 1 turn) or pay a 1d6 × 100 GP bribe to keep them.',
    effectType: 'criminal',
  },
  {
    min: 59,
    max: 63,
    title: 'Extraordinary Opportunity',
    severity: 'good',
    summary: 'Your Bastion is invited to host an important festival, royal gala, or symposium. If you spend 500 GP, your Bastion’s renown spreads and you gain an immediate roll on the Treasure or Friendly Visitors outcome.',
    effectType: 'opportunity',
  },
  {
    min: 64,
    max: 72,
    title: 'Friendly Visitors',
    severity: 'good',
    summary: 'Caravans, pilgrims, or travelers seek permission to use one of your Special Facilities briefly. They gladly pay 1d6 × 100 GP for the hospitality.',
    effectType: 'visitors',
  },
  {
    min: 73,
    max: 76,
    title: 'Guest',
    severity: 'good',
    summary: 'A notable guest arrives—either a friendly planar/fey envoy bearing a gift (Potion of Greater Healing or letter of recommendation) or an individual seeking refuge (granting +1d4 temporary Defenders).',
    effectType: 'guest',
  },
  {
    min: 77,
    max: 79,
    title: 'Lost Hirelings',
    severity: 'warning',
    summary: 'The hirelings of one random Special Facility abandon their post due to a fright, scandal, or better offer. That facility cannot take orders next turn unless you spend 100 GP to hire replacements.',
    effectType: 'lost_hirelings',
  },
  {
    min: 80,
    max: 83,
    title: 'Magical Discovery',
    severity: 'good',
    summary: 'Your hirelings uncover or brew an unexpected magical cache! You gain one Uncommon potion or scroll (such as a Potion of Superior Healing or Spell Scroll of 3rd level) stored in your vault.',
    effectType: 'magic',
  },
  {
    min: 84,
    max: 91,
    title: 'Refugees',
    severity: 'neutral',
    summary: 'A group of 2d4 refugees fleeing monsters or disaster arrives seeking shelter. Housing them in Basic Facilities earns 1d6 × 100 GP from grateful patrons or local lords.',
    effectType: 'refugees',
  },
  {
    min: 92,
    max: 98,
    title: 'Request for Aid',
    severity: 'neutral',
    summary: 'A local leader or ally sends an urgent plea for assistance. Dispatching your Bastion Defenders (if you have at least 4) resolves the crisis and earns 1d6 × 100 GP in reward.',
    effectType: 'aid',
  },
  {
    min: 99,
    max: 100,
    title: 'Treasure!',
    severity: 'epic',
    summary: 'Your hirelings unearth a hidden strongbox or receive an unexpected inheritance! Roll on the DMG Treasure Hoard or gain 2d6 × 100 GP plus an Uncommon magic item.',
    effectType: 'treasure',
  },
];

const ORDER_BADGES = {
  Craft: 'bg-amber-900/40 text-amber-300 border-amber-500/40',
  Empower: 'bg-purple-900/40 text-purple-300 border-purple-500/40',
  Harvest: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40',
  Recruit: 'bg-red-900/40 text-red-300 border-red-500/40',
  Research: 'bg-sky-900/40 text-sky-300 border-sky-500/40',
  Trade: 'bg-yellow-900/40 text-yellow-200 border-yellow-500/40',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMaxSpecialSlots(level) {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 2;
  return 0;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateCampaignCode() {
  const prefixes = ['FAERUN', 'BREMEN', 'SHADOW', 'WYVERN', 'AVERNU', 'SILVER', 'DRAGON', 'MYTHAL'];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  if (Math.random() > 0.5) {
    return prefixes[Math.floor(Math.random() * prefixes.length)];
  }
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function normalizeCampaignCode(code) {
  return (code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

// ============================================================================
// PRESET TEMPLATES
// ============================================================================

const PRESET_TEMPLATES = {
  starter_keep: {
    bastionName: '',
    ownerName: '',
    characterLevel: 5,
    treasury: 0,
    defenders: 0,
    turnCount: 1,
    dmOverride: false,
    campaignCode: '',
    specialFacilities: [],
    basicFacilities: [],
    chronicle: [],
  },
  adventurers_guildhall: {
    bastionName: 'The Gilded Griffin Lodge',
    ownerName: 'Lyra Silverstring & Company',
    characterLevel: 9,
    treasury: 3400,
    defenders: 18,
    turnCount: 6,
    dmOverride: false,
    campaignCode: '',
    specialFacilities: [
      {
        uid: 'sp_g1',
        catalogId: 'barrack',
        customName: 'Griffin Guardhouse',
        space: 'Vast',
        hirelingNotes: 'Captain Darian (Enlarged Vast Barracks)',
        damaged: false,
        assignedOrder: 'Recruit',
      },
      {
        uid: 'sp_g2',
        catalogId: 'armory',
        customName: 'Vault of Blades',
        space: 'Roomy',
        hirelingNotes: 'Quartermaster Hilda (Defenders roll d8)',
        damaged: false,
        assignedOrder: 'Trade',
      },
      {
        uid: 'sp_g3',
        catalogId: 'teleportation_circle',
        customName: 'Astral Waystone Chamber',
        space: 'Roomy',
        hirelingNotes: 'Adept Vaelen',
        damaged: false,
        assignedOrder: 'Recruit',
      },
      {
        uid: 'sp_g4',
        catalogId: 'theater',
        customName: 'The Starlight Amphitheater',
        space: 'Vast',
        hirelingNotes: 'Maestro Orpheo & 3 troupe leads',
        damaged: false,
        assignedOrder: 'Empower',
      },
    ],
    basicFacilities: [
      { uid: 'bf_g1', typeId: 'dining_room', customName: 'Feast Hall', space: 'Vast' },
      { uid: 'bf_g2', typeId: 'bedroom', customName: 'Suite of Heroes', space: 'Roomy' },
      { uid: 'bf_g3', typeId: 'kitchen', customName: 'Grand Kitchens', space: 'Roomy' },
      { uid: 'bf_g4', typeId: 'parlor', customName: 'Map & Contract Parlor', space: 'Roomy' },
    ],
    chronicle: [
      {
        id: 'log_init_2',
        turn: 6,
        type: 'turn',
        title: 'Bastion Turn 6 — Thriving Guildhall',
        details: 'Theater rehearsed "Ballad of the Silver Wyrm" (Empower). Teleportation Circle summoned Archmage Solis.',
        timestamp: 'Day 42',
      },
    ],
  },
  wizards_sanctum: {
    bastionName: 'Spire of the Astral Pendulum',
    ownerName: 'Archmage Thaddeus Crowe',
    characterLevel: 13,
    treasury: 7250,
    defenders: 10,
    turnCount: 14,
    dmOverride: false,
    campaignCode: '',
    specialFacilities: [
      {
        uid: 'sp_w1',
        catalogId: 'arcane_study',
        customName: 'Starlight Study',
        space: 'Roomy',
        hirelingNotes: 'Homunculus "Quill" & Scribe Mira',
        damaged: false,
        assignedOrder: 'Craft',
      },
      {
        uid: 'sp_w2',
        catalogId: 'library',
        customName: 'Athenaeum of Forgotten Lore',
        space: 'Vast',
        hirelingNotes: 'Head Librarian Fenwick & Assistant',
        damaged: false,
        assignedOrder: 'Research',
      },
      {
        uid: 'sp_w3',
        catalogId: 'archive',
        customName: 'The Restricted Vault',
        space: 'Vast',
        hirelingNotes: 'Archivist Ysolde',
        damaged: false,
        assignedOrder: 'Research',
      },
      {
        uid: 'sp_w4',
        catalogId: 'observatory',
        customName: 'Celestial Oculus',
        space: 'Roomy',
        hirelingNotes: 'Stargazer Pell',
        damaged: false,
        assignedOrder: 'Empower',
      },
      {
        uid: 'sp_w5',
        catalogId: 'teleportation_circle',
        customName: 'Sigil Rotunda',
        space: 'Roomy',
        hirelingNotes: 'Apprentice Corvus',
        damaged: false,
        assignedOrder: 'Idle',
      },
    ],
    basicFacilities: [
      { uid: 'bf_w1', typeId: 'bedroom', customName: 'High Tower Chambers', space: 'Roomy' },
      { uid: 'bf_w2', typeId: 'parlor', customName: 'Planar Salon', space: 'Roomy' },
      { uid: 'bf_w3', typeId: 'kitchen', customName: 'Automaton Galley', space: 'Cramped' },
    ],
    chronicle: [
      {
        id: 'log_init_3',
        turn: 14,
        type: 'event',
        title: 'Bastion Turn 14 — Magical Discovery',
        details: 'While Thaddeus was away in Sigil, hirelings discovered a Spell Scroll of Teleportation Circle in the Restricted Vault.',
        timestamp: 'Day 98',
      },
    ],
  },
  blank_bastion: {
    bastionName: 'New Bastion Stronghold',
    ownerName: 'Adventurer',
    characterLevel: 5,
    treasury: 1000,
    defenders: 0,
    turnCount: 1,
    dmOverride: false,
    campaignCode: '',
    specialFacilities: [],
    basicFacilities: [
      { uid: 'bf_b1', typeId: 'bedroom', customName: 'Main Quarters', space: 'Cramped' },
      { uid: 'bf_b2', typeId: 'courtyard', customName: 'Entry Courtyard', space: 'Roomy' },
    ],
    chronicle: [
      {
        id: 'log_init_blank',
        turn: 1,
        type: 'milestone',
        title: 'Bastion Groundbreaking',
        details: 'Land deed secured. Ready to construct Basic and Special Facilities.',
        timestamp: 'Day 1',
      },
    ],
  },
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // --------------------------------------------------------------------------
  // 1. FIREBASE AUTHENTICATION & CLOUD MULTI-BASTION STATE
  // --------------------------------------------------------------------------
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // User's Cloud Bastion List & Active Bastion ID
  const [userBastions, setUserBastions] = useState([]);
  const [activeBastionId, setActiveBastionId] = useState('primary_bastion');
  const [bastionSwitcherOpen, setBastionSwitcherOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'synced' | 'saving' | 'offline'

  // Active Bastion State (Editable)
  const [bastion, setBastion] = useState(() => ({
    id: 'primary_bastion',
    ...JSON.parse(JSON.stringify(PRESET_TEMPLATES.starter_keep)),
  }));

  // Track last synced JSON snapshot to prevent write loops from incoming snapshots
  const lastRemoteJsonRef = useRef('');
  const saveTimeoutRef = useRef(null);

  // Multiplayer Campaign Sync State
  const [campaignCodeInput, setCampaignCodeInput] = useState('');
  const [campaignBastions, setCampaignBastions] = useState([]);
  const [campaignSyncStatus, setCampaignSyncStatus] = useState('idle'); // 'idle' | 'live' | 'error'
  const [inspectedPartyBastion, setInspectedPartyBastion] = useState(null); // Read-only inspection modal/view

  // UI Navigation & Modal States
  const [activeTab, setActiveTab] = useState('blueprint'); // 'blueprint' | 'catalog' | 'turns' | 'chronicle' | 'party'
  const [facilitySubTab, setFacilitySubTab] = useState('special'); // 'special' | 'basic'
  const [rulesDrawerOpen, setRulesDrawerOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);

  // Catalog Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogLevelFilter, setCatalogLevelFilter] = useState('ALL');
  const [catalogOrderFilter, setCatalogOrderFilter] = useState('ALL');

  // Basic Facility Creator State
  const [newBasicType, setNewBasicType] = useState('bedroom');
  const [newBasicSpace, setNewBasicSpace] = useState('Cramped');
  const [newBasicName, setNewBasicName] = useState('');
  const [deductGoldOnBuild, setDeductGoldOnBuild] = useState(false);

  // Maintain Event Resolution Interactive State
  const [isRollingEvent, setIsRollingEvent] = useState(false);
  const [animatedRollNumber, setAnimatedRollNumber] = useState(null);
  const [activeEventResult, setActiveEventResult] = useState(null);

  // Custom Chronicle Note Input
  const [customNoteTitle, setCustomNoteTitle] = useState('');
  const [customNoteBody, setCustomNoteBody] = useState('');

  // Toast / Status Banner
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (message, tone = 'gold') => {
    setToast({ message, tone, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 3400 ? null : prev));
    }, 3600);
  };

  // --------------------------------------------------------------------------
  // FIREBASE AUTH LIFECYCLE (RULE 3: AUTH FIRST)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Initial auth fallback:', err);
        if (isMounted) {
          setSyncStatus('offline');
          setAuthLoading(false);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('offline');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Check URL query param `?campaign=CODE` on mount for effortless party invites
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = normalizeCampaignCode(params.get('campaign'));
      if (urlCode) {
        setCampaignCodeInput(urlCode);
        setBastion((prev) => ({ ...prev, campaignCode: urlCode }));
        setActiveTab('party');
      }
    } catch (_) {
      // Ignore if sandboxed iframe restricts location.search
    }
  }, []);

  // --------------------------------------------------------------------------
  // FIRESTORE REAL-TIME LISTENER: USER'S PERSONAL BASTIONS (RULE 1 & 2)
  // Path: /artifacts/{appId}/users/{userId}/bastions
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const userBastionsCol = collection(db, 'artifacts', appId, 'users', user.uid, 'bastions');

    const unsubscribe = onSnapshot(
      userBastionsCol,
      (snapshot) => {
        const docsList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setUserBastions(docsList);
        setSyncStatus('synced');

        if (docsList.length === 0) {
          // Seed initial starter bastion for new cloud user
          const initialId = 'bastion_' + generateId();
          const starterPayload = {
            id: initialId,
            ...JSON.parse(JSON.stringify(PRESET_TEMPLATES.starter_keep)),
            ownerUid: user.uid,
            ownerEmail: user.email || 'Guest Adventurer',
            updatedAt: Date.now(),
          };
          lastRemoteJsonRef.current = JSON.stringify(starterPayload);
          setActiveBastionId(initialId);
          setBastion(starterPayload);
          setDoc(
            doc(db, 'artifacts', appId, 'users', user.uid, 'bastions', initialId),
            starterPayload
          ).catch((e) => console.error('Seed bastion error:', e));
        } else {
          // Find currently active bastion or default to first
          const currentMatch =
            docsList.find((b) => b.id === activeBastionId) || docsList[0];

          if (currentMatch) {
            if (currentMatch.id !== activeBastionId) {
              setActiveBastionId(currentMatch.id);
            }
            const serialized = JSON.stringify(currentMatch);
            if (serialized !== lastRemoteJsonRef.current) {
              lastRemoteJsonRef.current = serialized;
              setBastion(currentMatch);
            }
          }
        }
      },
      (error) => {
        console.error('Firestore user bastions snapshot error:', error);
        setSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, [user, activeBastionId]);

  // --------------------------------------------------------------------------
  // FIRESTORE AUTO-SAVE EFFECT (USER PRIVATE + CAMPAIGN PUBLIC MIRROR)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!user || !bastion?.id) return;

    const currentSerialized = JSON.stringify(bastion);
    if (currentSerialized === lastRemoteJsonRef.current) return;

    setSyncStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          ...bastion,
          ownerUid: user.uid,
          ownerDisplayName:
            user.displayName || (user.email ? user.email.split('@')[0] : 'Guest Player'),
          updatedAt: Date.now(),
        };

        lastRemoteJsonRef.current = JSON.stringify(payload);

        // 1. Write to private user Bastion document
        const userDocRef = doc(
          db,
          'artifacts',
          appId,
          'users',
          user.uid,
          'bastions',
          bastion.id
        );
        await setDoc(userDocRef, payload, { merge: true });

        // 2. If linked to a Multiplayer Campaign Code, sync to shared Campaign collection
        // Path: /artifacts/{appId}/public/data/campaign_bastions (filtered in JS by campaignCode)
        const cleanCode = normalizeCampaignCode(bastion.campaignCode);
        if (cleanCode) {
          const sharedDocId = `${cleanCode}_${user.uid}_${bastion.id}`;
          const campaignDocRef = doc(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'campaign_bastions',
            sharedDocId
          );
          await setDoc(
            campaignDocRef,
            {
              ...payload,
              campaignCode: cleanCode,
              sharedDocId,
            },
            { merge: true }
          );
        }

        setSyncStatus('synced');
      } catch (err) {
        console.error('Cloud save error:', err);
        setSyncStatus('offline');
      }
    }, 450);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [bastion, user]);

  // --------------------------------------------------------------------------
  // FIRESTORE REAL-TIME LISTENER: MULTIPLAYER CAMPAIGN SYNC (RULE 1 & 2)
  // Fetch all from /artifacts/{appId}/public/data/campaign_bastions & filter in JS
  // --------------------------------------------------------------------------
  const activeCampaignCode = normalizeCampaignCode(bastion.campaignCode);

  useEffect(() => {
    if (!user || !activeCampaignCode) {
      setCampaignBastions([]);
      setCampaignSyncStatus('idle');
      return;
    }

    setCampaignSyncStatus('live');
    const campaignCol = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'campaign_bastions'
    );

    const unsubscribe = onSnapshot(
      campaignCol,
      (snapshot) => {
        const allShared = snapshot.docs.map((d) => ({
          sharedDocId: d.id,
          ...d.data(),
        }));
        const matchingParty = allShared
          .filter((item) => normalizeCampaignCode(item.campaignCode) === activeCampaignCode)
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        setCampaignBastions(matchingParty);
        setCampaignSyncStatus('live');
      },
      (error) => {
        console.error('Campaign sync error:', error);
        setCampaignSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, activeCampaignCode]);

  // --------------------------------------------------------------------------
  // AUTH HANDLERS (GOOGLE, EMAIL/PASSWORD, SIGN OUT)
  // --------------------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuthModalOpen(false);
      showToast('Signed in with Google! Your Bastions are cloud-synced.', 'emerald');
    } catch (err) {
      setAuthError(err.message || 'Google Sign-In failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter both an email address and password.');
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        showToast('Account created! Bastions synced to cloud.', 'emerald');
      } else {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        showToast('Signed in! Loaded your cloud Bastions.', 'emerald');
      }
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOutToGuest = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
      showToast('Signed out. Switched to Guest session.', 'neutral');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // --------------------------------------------------------------------------
  // MULTI-BASTION MANAGEMENT HANDLERS
  // --------------------------------------------------------------------------
  const handleCreateNewCloudBastion = async (presetKey = 'blank_bastion') => {
    if (!user) return;
    const newId = 'bastion_' + generateId();
    const template = JSON.parse(JSON.stringify(PRESET_TEMPLATES[presetKey] || PRESET_TEMPLATES.blank_bastion));
    const newBastionObj = {
      id: newId,
      ...template,
      bastionName:
        presetKey === 'blank_bastion'
          ? `Bastion #${userBastions.length + 1}`
          : template.bastionName,
      campaignCode: activeCampaignCode || '',
      ownerUid: user.uid,
      updatedAt: Date.now(),
    };

    setActiveBastionId(newId);
    setBastion(newBastionObj);
    setBastionSwitcherOpen(false);
    setActiveEventResult(null);

    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, 'bastions', newId),
        newBastionObj
      );
      showToast(`Created new Bastion: ${newBastionObj.bastionName}`, 'gold');
    } catch (err) {
      console.error('Error creating bastion:', err);
    }
  };

  const handleSelectBastion = (targetBastion) => {
    setActiveBastionId(targetBastion.id);
    setBastion(targetBastion);
    lastRemoteJsonRef.current = JSON.stringify(targetBastion);
    setBastionSwitcherOpen(false);
    setActiveEventResult(null);
    showToast(`Switched to ${targetBastion.bastionName}`, 'gold');
  };

  const handleDeleteCurrentBastion = async () => {
    if (!user || userBastions.length <= 1) {
      showToast('You must keep at least one Bastion in your ledger.', 'crimson');
      return;
    }
    const targetId = bastion.id;
    const targetName = bastion.bastionName;
    const cleanCode = normalizeCampaignCode(bastion.campaignCode);

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'bastions', targetId));
      if (cleanCode) {
        const sharedDocId = `${cleanCode}_${user.uid}_${targetId}`;
        await deleteDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'campaign_bastions', sharedDocId)
        );
      }
      const nextBastion = userBastions.find((b) => b.id !== targetId);
      if (nextBastion) {
        setActiveBastionId(nextBastion.id);
        setBastion(nextBastion);
      }
      showToast(`Deleted "${targetName}".`, 'neutral');
    } catch (err) {
      console.error('Delete bastion failed:', err);
    }
  };

  // --------------------------------------------------------------------------
  // MULTIPLAYER CAMPAIGN LINK / UNLINK HANDLERS
  // --------------------------------------------------------------------------
  const handleCreateNewCampaign = () => {
    const freshCode = generateCampaignCode();
    setCampaignCodeInput(freshCode);
    setBastion((prev) => ({ ...prev, campaignCode: freshCode }));
    showToast(`Created Campaign "${freshCode}"! Share this code with your party.`, 'emerald');
  };

  const handleJoinCampaign = (e) => {
    e.preventDefault();
    const code = normalizeCampaignCode(campaignCodeInput);
    if (!code || code.length < 3) {
      showToast('Enter a valid Campaign Code (3–12 letters/numbers).', 'crimson');
      return;
    }
    setCampaignCodeInput(code);
    setBastion((prev) => ({ ...prev, campaignCode: code }));
    showToast(`Linked "${bastion.bastionName}" to Campaign ${code}!`, 'emerald');
  };

  const handleLeaveCampaign = async () => {
    const oldCode = activeCampaignCode;
    setBastion((prev) => ({ ...prev, campaignCode: '' }));
    setCampaignCodeInput('');
    if (user && oldCode && bastion.id) {
      try {
        const sharedDocId = `${oldCode}_${user.uid}_${bastion.id}`;
        await deleteDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'campaign_bastions', sharedDocId)
        );
      } catch (err) {
        console.error('Error unlinking campaign:', err);
      }
    }
    showToast('Unlinked Bastion from shared campaign.', 'neutral');
  };

  const handleCopyInviteLink = () => {
    if (!activeCampaignCode) return;
    let shareText = `Join our D&D 5.5e Bastion Campaign! Campaign Code: ${activeCampaignCode}`;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('campaign', activeCampaignCode);
      shareText = `${shareText}\nDirect Link: ${url.toString()}`;
    } catch (_) {
      // Fallback to code only
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast(`Copied Campaign Code "${activeCampaignCode}" & invite info!`, 'gold');
    } else {
      showToast(`Campaign Code: ${activeCampaignCode}`, 'gold');
    }
  };

  // ==========================================================================
  // DERIVED METRICS & FLOORPLAN CALCULATIONS
  // ==========================================================================

  const maxSpecialSlots = useMemo(
    () => getMaxSpecialSlots(bastion.characterLevel),
    [bastion.characterLevel]
  );

  const hasArmory = useMemo(
    () => bastion.specialFacilities.some((f) => f.catalogId === 'armory' && !f.damaged),
    [bastion.specialFacilities]
  );

  const defenderCapacity = useMemo(() => {
    const barracks = bastion.specialFacilities.filter(
      (f) => f.catalogId === 'barrack' && !f.damaged
    );
    if (barracks.length === 0) return 0;
    return barracks.reduce((sum, b) => sum + (b.space === 'Vast' ? 25 : 12), 0);
  }, [bastion.specialFacilities]);

  const totalHirelings = useMemo(() => {
    return bastion.specialFacilities.reduce((sum, inst) => {
      const cat = SPECIAL_FACILITIES_CATALOG.find((c) => c.id === inst.catalogId);
      if (!cat) return sum;
      let count = cat.hirelings;
      if (inst.space === 'Vast') {
        if (cat.id === 'library') count += 1;
        if (cat.id === 'workshop') count += 2;
        if (cat.id === 'pub') count += 3;
      }
      return sum + count;
    }, 0);
  }, [bastion.specialFacilities]);

  const floorplanStats = useMemo(() => {
    let specialSquares = 0;
    let basicSquares = 0;

    bastion.specialFacilities.forEach((f) => {
      specialSquares += SPACE_SPECS[f.space]?.squares || 16;
    });
    bastion.basicFacilities.forEach((f) => {
      basicSquares += SPACE_SPECS[f.space]?.squares || 4;
    });

    const totalSquares = specialSquares + basicSquares;
    const totalSqFt = totalSquares * 25;
    return { specialSquares, basicSquares, totalSquares, totalSqFt };
  }, [bastion.specialFacilities, bastion.basicFacilities]);

  // ==========================================================================
  // STATE MUTATION HANDLERS
  // ==========================================================================

  const updateField = (field, value) => {
    setBastion((prev) => ({ ...prev, [field]: value }));
  };

  const addLogEntry = (entry) => {
    setBastion((prev) => ({
      ...prev,
      chronicle: [
        {
          id: 'log_' + generateId(),
          turn: prev.turnCount,
          timestamp: `Day ${(prev.turnCount - 1) * 7 + 1}`,
          ...entry,
        },
        ...prev.chronicle,
      ],
    }));
  };

  const handleLoadPreset = (presetKey) => {
    const template = PRESET_TEMPLATES[presetKey];
    if (!template) return;
    setBastion((prev) => ({
      ...JSON.parse(JSON.stringify(template)),
      id: prev.id,
      campaignCode: prev.campaignCode || '',
    }));
    setPresetsOpen(false);
    setActiveEventResult(null);
    showToast(`Applied template: ${template.bastionName}`, 'gold');
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(bastion, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (bastion.bastionName || 'bastion')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    link.href = url;
    link.download = `${safeName}_dnd55e.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Bastion save file exported as JSON.', 'emerald');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.bastionName || !Array.isArray(imported.specialFacilities)) {
          throw new Error('Invalid Bastion JSON structure.');
        }
        setBastion((prev) => ({
          ...imported,
          id: prev.id,
          campaignCode: imported.campaignCode ?? prev.campaignCode ?? '',
        }));
        setActiveEventResult(null);
        showToast(`Imported "${imported.bastionName}" & synced to cloud!`, 'emerald');
      } catch (err) {
        showToast('Could not import file: Invalid Bastion JSON format.', 'crimson');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add Special Facility
  const handleAddSpecialFacility = (catalogItem) => {
    const atSlotLimit = bastion.specialFacilities.length >= maxSpecialSlots;
    const levelTooLow = bastion.characterLevel < catalogItem.level;

    if (!bastion.dmOverride && (atSlotLimit || levelTooLow)) {
      showToast(
        levelTooLow
          ? `Requires Character Level ${catalogItem.level}+ (or enable DM Override).`
          : `Maximum ${maxSpecialSlots} Special Facilities reached for Level ${bastion.characterLevel}.`,
        'crimson'
      );
      return;
    }

    const newFacility = {
      uid: 'sp_' + generateId(),
      catalogId: catalogItem.id,
      customName: catalogItem.name,
      space: catalogItem.space,
      hirelingNotes: `${catalogItem.hirelings} assigned hireling${catalogItem.hirelings > 1 ? 's' : ''}`,
      damaged: false,
      assignedOrder: catalogItem.orders[0] || 'Idle',
    };

    setBastion((prev) => ({
      ...prev,
      specialFacilities: [...prev.specialFacilities, newFacility],
    }));

    addLogEntry({
      type: 'build',
      title: `Added Special Facility: ${catalogItem.name}`,
      details: `Constructed a ${catalogItem.space} ${catalogItem.name} (Level ${catalogItem.level} tier).`,
    });

    showToast(`Added ${catalogItem.name} to your Bastion!`, 'gold');
    setActiveTab('blueprint');
    setFacilitySubTab('special');
  };

  const handleRemoveSpecialFacility = (uid) => {
    const target = bastion.specialFacilities.find((f) => f.uid === uid);
    setBastion((prev) => ({
      ...prev,
      specialFacilities: prev.specialFacilities.filter((f) => f.uid !== uid),
    }));
    if (target) {
      showToast(`Removed ${target.customName}.`, 'neutral');
    }
  };

  const handleUpdateSpecialFacility = (uid, patch) => {
    setBastion((prev) => ({
      ...prev,
      specialFacilities: prev.specialFacilities.map((f) =>
        f.uid === uid ? { ...f, ...patch } : f
      ),
    }));
  };

  const handleEnlargeSpecialFacility = (uid) => {
    const inst = bastion.specialFacilities.find((f) => f.uid === uid);
    if (!inst || inst.space === 'Vast') return;
    const cost = 2000;
    if (!bastion.dmOverride && bastion.treasury < cost) {
      showToast(`Need ${cost.toLocaleString()} GP in Treasury to enlarge to Vast.`, 'crimson');
      return;
    }

    setBastion((prev) => ({
      ...prev,
      treasury: prev.dmOverride && prev.treasury < cost ? prev.treasury : prev.treasury - cost,
      specialFacilities: prev.specialFacilities.map((f) =>
        f.uid === uid ? { ...f, space: 'Vast' } : f
      ),
    }));

    addLogEntry({
      type: 'build',
      title: `Enlarged ${inst.customName} to Vast`,
      details: `Expanded ${inst.customName} from Roomy (16 sq) to Vast (36 sq) for ${cost.toLocaleString()} GP.`,
    });
    showToast(`${inst.customName} enlarged to Vast (36 squares)!`, 'gold');
  };

  // Add Basic Facility
  const handleAddBasicFacility = (e) => {
    e.preventDefault();
    const typeObj = BASIC_FACILITY_TYPES.find((t) => t.id === newBasicType) || BASIC_FACILITY_TYPES[0];
    const spec = SPACE_SPECS[newBasicSpace];
    const displayName = newBasicName.trim() || `${spec.name} ${typeObj.name}`;

    if (deductGoldOnBuild && !bastion.dmOverride && bastion.treasury < spec.buildCost) {
      showToast(`Insufficient GP (requires ${spec.buildCost.toLocaleString()} GP).`, 'crimson');
      return;
    }

    const newBasic = {
      uid: 'bf_' + generateId(),
      typeId: typeObj.id,
      customName: displayName,
      space: newBasicSpace,
    };

    setBastion((prev) => ({
      ...prev,
      treasury: deductGoldOnBuild ? Math.max(0, prev.treasury - spec.buildCost) : prev.treasury,
      basicFacilities: [...prev.basicFacilities, newBasic],
    }));

    addLogEntry({
      type: 'build',
      title: `Built Basic Facility: ${displayName}`,
      details: `Added ${spec.name} (${spec.squares} sq / ${spec.sqFt} sq ft)${
        deductGoldOnBuild ? ` for ${spec.buildCost.toLocaleString()} GP (${spec.buildDays} days)` : ''
      }.`,
    });

    setNewBasicName('');
    showToast(`Constructed ${displayName}!`, 'gold');
  };

  const handleEnlargeBasicFacility = (uid) => {
    const bf = bastion.basicFacilities.find((b) => b.uid === uid);
    if (!bf) return;
    const currentSpec = SPACE_SPECS[bf.space];
    if (!currentSpec?.nextSize) return;

    const cost = currentSpec.enlargeCost;
    if (deductGoldOnBuild && !bastion.dmOverride && bastion.treasury < cost) {
      showToast(`Requires ${cost.toLocaleString()} GP in Treasury to enlarge.`, 'crimson');
      return;
    }

    setBastion((prev) => ({
      ...prev,
      treasury: deductGoldOnBuild ? Math.max(0, prev.treasury - cost) : prev.treasury,
      basicFacilities: prev.basicFacilities.map((item) =>
        item.uid === uid ? { ...item, space: currentSpec.nextSize } : item
      ),
    }));

    addLogEntry({
      type: 'build',
      title: `Enlarged ${bf.customName} → ${currentSpec.nextSize}`,
      details: `Expanded ${bf.customName} to ${currentSpec.nextSize} (${
        SPACE_SPECS[currentSpec.nextSize].squares
      } sq)${deductGoldOnBuild ? ` for ${cost.toLocaleString()} GP (${currentSpec.enlargeDays} days)` : ''}.`,
    });
    showToast(`Enlarged ${bf.customName} to ${currentSpec.nextSize}!`, 'gold');
  };

  const handleRemoveBasicFacility = (uid) => {
    setBastion((prev) => ({
      ...prev,
      basicFacilities: prev.basicFacilities.filter((b) => b.uid !== uid),
    }));
    showToast('Basic facility removed.', 'neutral');
  };

  // ==========================================================================
  // BASTION TURN & EVENTS SIMULATOR LOGIC
  // ==========================================================================

  const handleResolveActiveTurn = () => {
    const activeOrders = [];
    const damagedFacilities = [];
    let recruitedDefenders = 0;

    bastion.specialFacilities.forEach((inst) => {
      if (inst.damaged) {
        damagedFacilities.push(inst.customName);
        return;
      }
      if (inst.assignedOrder && inst.assignedOrder !== 'Idle') {
        activeOrders.push(`${inst.customName} [${inst.assignedOrder}]`);
        if (inst.catalogId === 'barrack' && inst.assignedOrder === 'Recruit') {
          recruitedDefenders += 4;
        }
      }
    });

    const nextTurn = bastion.turnCount + 1;
    const newDefenderCount =
      defenderCapacity > 0
        ? Math.min(defenderCapacity, bastion.defenders + recruitedDefenders)
        : bastion.defenders + recruitedDefenders;

    const actualRecruited = newDefenderCount - bastion.defenders;

    const orderSummary =
      activeOrders.length > 0
        ? `Orders executed: ${activeOrders.join(', ')}.`
        : 'All Special Facilities remained Idle during this 7-day turn.';

    const extraNotes = [];
    if (actualRecruited > 0) {
      extraNotes.push(`Barracks recruited +${actualRecruited} Bastion Defenders (Total: ${newDefenderCount}).`);
    }
    if (damagedFacilities.length > 0) {
      extraNotes.push(`Shut down / damaged facilities skipped: ${damagedFacilities.join(', ')}.`);
    }

    setBastion((prev) => ({
      ...prev,
      turnCount: nextTurn,
      defenders: newDefenderCount,
      chronicle: [
        {
          id: 'log_' + generateId(),
          turn: prev.turnCount,
          timestamp: `Days ${(prev.turnCount - 1) * 7 + 1}–${prev.turnCount * 7}`,
          type: 'turn',
          title: `Bastion Turn ${prev.turnCount} Resolved (Active Orders)`,
          details: `${orderSummary} ${extraNotes.join(' ')}`.trim(),
        },
        ...prev.chronicle,
      ],
    }));

    showToast(`Turn ${bastion.turnCount} complete! Advanced to Turn ${nextTurn}.`, 'gold');
  };

  // Roll d100 on 2024 DMG Bastion Events Table (Maintain Order)
  const triggerMaintainEventRoll = () => {
    if (isRollingEvent) return;
    setIsRollingEvent(true);
    setActiveEventResult(null);

    let ticks = 0;
    const interval = setInterval(() => {
      setAnimatedRollNumber(Math.floor(Math.random() * 100) + 1);
      ticks += 1;
      if (ticks >= 14) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 100) + 1;
        setAnimatedRollNumber(finalRoll);
        setIsRollingEvent(false);

        const matchedEvent =
          BASTION_EVENTS_TABLE.find((e) => finalRoll >= e.min && finalRoll <= e.max) ||
          BASTION_EVENTS_TABLE[0];

        const d6Roll = () => Math.floor(Math.random() * 6) + 1;
        const d8Roll = () => Math.floor(Math.random() * 8) + 1;
        const dieSides = hasArmory ? 8 : 6;
        const attackDice = Array.from({ length: 6 }, () => (hasArmory ? d8Roll() : d6Roll()));
        const attackLosses = attackDice.filter((v) => v === 1).length;
        const goldRoll = d6Roll() * 100;
        const treasureGoldRoll = (d6Roll() + d6Roll()) * 100;
        const refugeeCount = d6Roll() + d6Roll();

        const activeSpecials = bastion.specialFacilities.filter((f) => !f.damaged);
        const randomFacility =
          activeSpecials.length > 0
            ? activeSpecials[Math.floor(Math.random() * activeSpecials.length)]
            : null;

        setActiveEventResult({
          roll: finalRoll,
          event: matchedEvent,
          attackDice,
          dieSides,
          attackLosses,
          goldRoll,
          treasureGoldRoll,
          refugeeCount,
          targetFacilityUid: randomFacility?.uid || null,
          targetFacilityName: randomFacility?.customName || 'None',
          resolved: false,
          resolutionNote: '',
        });
      }
    }, 55);
  };

  const applyEventResolution = (choice) => {
    if (!activeEventResult || activeEventResult.resolved) return;
    const {
      roll,
      event,
      attackDice,
      dieSides,
      attackLosses,
      goldRoll,
      treasureGoldRoll,
      refugeeCount,
      targetFacilityUid,
      targetFacilityName,
    } = activeEventResult;

    let gpDelta = 0;
    let defenderDelta = 0;
    let facilityToDamage = null;
    let resolutionText = '';

    if (event.effectType === 'none') {
      resolutionText = 'All is well. Hirelings maintained the Bastion cleanly.';
    } else if (event.effectType === 'attack') {
      const diceStr = `[${attackDice.join(', ')}] on 6d${dieSides}`;
      if (bastion.defenders === 0) {
        facilityToDamage = targetFacilityUid;
        resolutionText = `Attack rolled ${diceStr}. With 0 Bastion Defenders, ${
          targetFacilityUid ? `${targetFacilityName} was damaged and shut down!` : 'the Bastion suffered structural damage.'
        }`;
      } else {
        const actualLost = Math.min(bastion.defenders, attackLosses);
        defenderDelta = -actualLost;
        const remaining = bastion.defenders - actualLost;
        if (remaining === 0 && attackLosses >= bastion.defenders && targetFacilityUid) {
          facilityToDamage = targetFacilityUid;
          resolutionText = `Attack rolled ${diceStr} (${attackLosses} ones). All ${actualLost} Defenders fell, and ${targetFacilityName} was damaged and shut down!`;
        } else {
          resolutionText = `Attack rolled ${diceStr}. Lost ${actualLost} Bastion Defender${
            actualLost === 1 ? '' : 's'
          } (${remaining} remaining).`;
        }
      }
    } else if (event.effectType === 'criminal') {
      if (choice === 'bribe') {
        gpDelta = -goldRoll;
        resolutionText = `Paid a ${goldRoll} GP bribe to officials to retain the criminal hireling.`;
      } else {
        facilityToDamage = targetFacilityUid;
        resolutionText = `Surrendered the criminal hireling to authorities. ${
          targetFacilityUid ? `${targetFacilityName} is shut down for 1 turn.` : 'Operations paused briefly.'
        }`;
      }
    } else if (event.effectType === 'opportunity') {
      if (choice === 'invest') {
        gpDelta = -500 + treasureGoldRoll;
        resolutionText = `Invested 500 GP in hosting a grand gala, attracting wealthy patrons who gifted ${treasureGoldRoll} GP (Net: ${
          gpDelta >= 0 ? `+${gpDelta}` : gpDelta
        } GP)!`;
      } else {
        resolutionText = 'Declined the extraordinary opportunity to preserve treasury funds.';
      }
    } else if (event.effectType === 'visitors') {
      gpDelta = goldRoll;
      resolutionText = `Friendly visitors paid ${goldRoll} GP to use Bastion amenities.`;
    } else if (event.effectType === 'guest') {
      if (choice === 'refuge') {
        defenderDelta = 2;
        resolutionText = 'Granted refuge to a traveling warrior-envoy (+2 Bastion Defenders).';
      } else {
        resolutionText = 'Welcomed an honored guest who left a Potion of Greater Healing & a Letter of Recommendation.';
      }
    } else if (event.effectType === 'lost_hirelings') {
      if (choice === 'rehire') {
        gpDelta = -100;
        resolutionText = `Spent 100 GP to immediately recruit replacement hirelings for ${targetFacilityName}.`;
      } else {
        facilityToDamage = targetFacilityUid;
        resolutionText = `Hirelings abandoned ${targetFacilityName}; the facility is shut down until replacements are hired.`;
      }
    } else if (event.effectType === 'magic') {
      resolutionText = 'Hirelings discovered an Uncommon magic potion or 3rd-level Spell Scroll!';
    } else if (event.effectType === 'refugees') {
      gpDelta = goldRoll;
      resolutionText = `Sheltered ${refugeeCount} refugees in Basic Facilities; grateful regional patrons rewarded ${goldRoll} GP.`;
    } else if (event.effectType === 'aid') {
      if (bastion.defenders >= 4) {
        gpDelta = goldRoll;
        resolutionText = `Dispatched Bastion Defenders to answer a local Request for Aid, earning ${goldRoll} GP.`;
      } else {
        resolutionText = 'Received a Request for Aid, but lacked the 4 Bastion Defenders required to dispatch a relief force.';
      }
    } else if (event.effectType === 'treasure') {
      gpDelta = treasureGoldRoll;
      resolutionText = `Unearthed a hidden hoard worth ${treasureGoldRoll} GP plus an Uncommon magic item!`;
    }

    const nextTurn = bastion.turnCount + 1;

    setBastion((prev) => ({
      ...prev,
      turnCount: nextTurn,
      treasury: Math.max(0, prev.treasury + gpDelta),
      defenders: Math.max(0, prev.defenders + defenderDelta),
      specialFacilities: facilityToDamage
        ? prev.specialFacilities.map((f) =>
            f.uid === facilityToDamage ? { ...f, damaged: true } : f
          )
        : prev.specialFacilities,
      chronicle: [
        {
          id: 'log_' + generateId(),
          turn: prev.turnCount,
          timestamp: `Days ${(prev.turnCount - 1) * 7 + 1}–${prev.turnCount * 7}`,
          type: 'event',
          title: `Turn ${prev.turnCount} Maintain Order — d100 [${roll}]: ${event.title}`,
          details: resolutionText,
        },
        ...prev.chronicle,
      ],
    }));

    setActiveEventResult((prev) => ({
      ...prev,
      resolved: true,
      resolutionNote: resolutionText,
    }));

    showToast(`Maintain Turn ${bastion.turnCount} logged! Advanced to Turn ${nextTurn}.`, 'gold');
  };

  const handleAddCustomNote = (e) => {
    e.preventDefault();
    if (!customNoteTitle.trim() && !customNoteBody.trim()) return;
    addLogEntry({
      type: 'note',
      title: customNoteTitle.trim() || 'DM / Session Note',
      details: customNoteBody.trim() || 'Recorded an entry in the Bastion Chronicle.',
    });
    setCustomNoteTitle('');
    setCustomNoteBody('');
    showToast('Chronicle note recorded.', 'gold');
  };

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return SPECIAL_FACILITIES_CATALOG.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.summary.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.prerequisite.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesLevel =
        catalogLevelFilter === 'ALL' || item.level === Number(catalogLevelFilter);
      const matchesOrder =
        catalogOrderFilter === 'ALL' || item.orders.includes(catalogOrderFilter);
      return matchesSearch && matchesLevel && matchesOrder;
    });
  }, [catalogSearch, catalogLevelFilter, catalogOrderFilter]);

  const isGuestAccount = !user || user.isAnonymous;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-[#121318] text-stone-200 font-sans selection:bg-[#d4af37]/30 selection:text-amber-100 pb-16">
      {/* Subtle Top Ornamental Border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#9b2c2c] via-[#d4af37] to-[#9b2c2c]" />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl backdrop-blur-md ${
              toast.tone === 'crimson'
                ? 'bg-red-950/95 border-red-500/60 text-red-100'
                : toast.tone === 'emerald'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100'
                : 'bg-[#1c1e26]/95 border-[#d4af37]/60 text-amber-100'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-[#d4af37]" />
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-stone-400 hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FIREBASE ACCOUNT / SIGN-IN MODAL                                     */}
      {/* ==================================================================== */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1e26] border border-[#d4af37]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                  Cloud Account & Party Sync
                </span>
                <h2 className="text-xl font-serif font-bold text-stone-100 mt-0.5">
                  {authMode === 'signin' ? 'Sign In to BastionForge' : 'Create Player Account'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                  setAuthError('');
                }}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Sign in to access your Bastions from any phone, tablet, or laptop and sync live with your D&D party campaign.
            </p>

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authBusy}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-white text-stone-900 font-bold text-sm flex items-center justify-center gap-2.5 shadow transition disabled:opacity-50"
            >
              <Globe className="w-4 h-4 text-[#9b2c2c]" />
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-stone-700" />
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-stone-500">
                Or with Email
              </span>
              <div className="flex-grow border-t border-stone-700" />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="adventurer@waterdeep.org"
                    className="w-full bg-[#121318] border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#121318] border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/50 text-xs text-red-200">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authBusy}
                className="w-full py-2.5 rounded-xl bg-[#d4af37] hover:bg-amber-400 text-[#121318] font-bold text-sm transition shadow-md disabled:opacity-50"
              >
                {authBusy
                  ? 'Authenticating...'
                  : authMode === 'signin'
                  ? 'Sign In with Email'
                  : 'Create Cloud Account'}
              </button>
            </form>

            <div className="text-center text-xs text-stone-400 pt-1">
              {authMode === 'signin' ? (
                <>
                  Need an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError('');
                    }}
                    className="text-[#d4af37] hover:underline font-semibold"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError('');
                    }}
                    className="text-[#d4af37] hover:underline font-semibold"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* READ-ONLY PARTY BASTION INSPECTOR MODAL                              */}
      {/* ==================================================================== */}
      {inspectedPartyBastion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1c1e26] border border-[#d4af37]/50 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8 space-y-5">
            <div className="flex items-start justify-between border-b border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-500/40">
                    Read-Only Party Inspection
                  </span>
                  <span className="text-xs text-stone-400">
                    Campaign: <strong className="text-[#d4af37]">{activeCampaignCode}</strong>
                  </span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-stone-100 mt-1">
                  {inspectedPartyBastion.bastionName}
                </h2>
                <p className="text-xs text-amber-200/90">
                  Lord / Lady: <strong>{inspectedPartyBastion.ownerName}</strong> • Level{' '}
                  {inspectedPartyBastion.characterLevel} • Turn {inspectedPartyBastion.turnCount}
                </p>
              </div>
              <button
                onClick={() => setInspectedPartyBastion(null)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Stats Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#121318] p-3 rounded-xl border border-stone-800">
                <div className="text-xs text-stone-400">Treasury</div>
                <div className="text-lg font-bold text-amber-300">
                  {(inspectedPartyBastion.treasury || 0).toLocaleString()} GP
                </div>
              </div>
              <div className="bg-[#121318] p-3 rounded-xl border border-stone-800">
                <div className="text-xs text-stone-400">Bastion Defenders</div>
                <div className="text-lg font-bold text-red-300">
                  {inspectedPartyBastion.defenders || 0}
                </div>
              </div>
              <div className="bg-[#121318] p-3 rounded-xl border border-stone-800">
                <div className="text-xs text-stone-400">Special Facilities</div>
                <div className="text-lg font-bold text-[#d4af37]">
                  {(inspectedPartyBastion.specialFacilities || []).length} /{' '}
                  {getMaxSpecialSlots(inspectedPartyBastion.characterLevel || 5)}
                </div>
              </div>
            </div>

            {/* Special Facilities List */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Special Facilities & Current Orders
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {(inspectedPartyBastion.specialFacilities || []).map((inst) => {
                  const cat = SPECIAL_FACILITIES_CATALOG.find((c) => c.id === inst.catalogId);
                  return (
                    <div
                      key={inst.uid}
                      className="p-3 rounded-xl bg-[#121318] border border-stone-800"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif font-bold text-sm text-amber-100">
                          {inst.customName}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37]">
                          {inst.assignedOrder}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        {cat?.name} • {inst.space} • {inst.hirelingNotes}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Chronicle Entries */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Recent Bastion Chronicle Logs
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(inspectedPartyBastion.chronicle || []).slice(0, 4).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg bg-[#121318] border border-stone-800/80 text-xs"
                  >
                    <div className="font-bold text-stone-200">
                      Turn {entry.turn}: {entry.title}
                    </div>
                    <div className="text-stone-400 mt-0.5">{entry.details}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedPartyBastion(null)}
                className="px-4 py-2 rounded-lg bg-[#d4af37] text-[#121318] font-bold text-xs hover:bg-amber-400"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. BASTION PROFILE & OVERVIEW HEADER                                 */}
      {/* ==================================================================== */}
      <header className="bg-[#161820] border-b border-[#d4af37]/25 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Top Utility Strip: Branding + Cloud Account + Bastion Switcher + Presets + Export/Import + Rules */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-800/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-[#9b2c2c]/20 border border-[#d4af37]/40">
                <Castle className="w-6 h-6 text-[#d4af37]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                    D&D 5.5e • 2024 DMG Rules
                  </span>
                  {/* Live Cloud Sync Pill */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                        : syncStatus === 'saving'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                        : 'bg-stone-900 text-stone-400 border-stone-700'
                    }`}
                  >
                    {syncStatus === 'offline' ? (
                      <CloudOff className="w-3 h-3" />
                    ) : (
                      <Cloud className="w-3 h-3" />
                    )}
                    <span>
                      {syncStatus === 'synced'
                        ? 'Cloud Synced'
                        : syncStatus === 'saving'
                        ? 'Syncing...'
                        : 'Connecting...'}
                    </span>
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-serif font-bold tracking-wide text-stone-100">
                  BastionForge • Stronghold & Campaign Sync
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Cloud Bastion Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setBastionSwitcherOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#1c1e26] hover:bg-[#252834] text-amber-100 border border-[#d4af37]/50 transition"
                >
                  <Castle className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="max-w-[130px] truncate">
                    My Bastions ({userBastions.length || 1})
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {bastionSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#1c1e26] border border-[#d4af37]/50 shadow-2xl z-40 overflow-hidden">
                    <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 bg-[#14161c] border-b border-stone-800 flex items-center justify-between">
                      <span>Your Cloud Bastions</span>
                      <span className="text-[#d4af37]">{userBastions.length} Saved</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-stone-800/60">
                      {userBastions.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => handleSelectBastion(b)}
                          className={`w-full text-left px-3.5 py-2.5 transition flex items-center justify-between ${
                            b.id === bastion.id
                              ? 'bg-[#d4af37]/15 text-amber-100'
                              : 'hover:bg-[#262936] text-stone-200'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="text-xs font-bold truncate">{b.bastionName}</div>
                            <div className="text-[11px] text-stone-400 truncate">
                              Lvl {b.characterLevel} • {b.ownerName}
                              {b.campaignCode ? ` • [${b.campaignCode}]` : ''}
                            </div>
                          </div>
                          {b.id === bastion.id && (
                            <Check className="w-4 h-4 text-[#d4af37] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="p-2 bg-[#14161c] border-t border-stone-800 flex gap-1.5">
                      <button
                        onClick={() => handleCreateNewCloudBastion('blank_bastion')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#121318] font-bold text-xs transition"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>New Bastion</span>
                      </button>
                      {userBastions.length > 1 && (
                        <button
                          onClick={handleDeleteCurrentBastion}
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 text-red-200 border border-red-700/40"
                          title="Delete active Bastion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Presets Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setPresetsOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#1c1e26] hover:bg-[#252834] text-amber-200 border border-stone-700 transition"
                >
                  <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Templates</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {presetsOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg bg-[#1c1e26] border border-[#d4af37]/50 shadow-2xl z-40 overflow-hidden">
                    <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 bg-[#14161c] border-b border-stone-800">
                      Apply Preset to Active Bastion
                    </div>
                    <button
                      onClick={() => handleLoadPreset('starter_keep')}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#262936] transition border-b border-stone-800/60"
                    >
                      <div className="text-sm font-semibold text-amber-200">Level 5 Starter Keep</div>
                      <div className="text-xs text-stone-400">Barracks, Smithy, 8 Defenders</div>
                    </button>
                    <button
                      onClick={() => handleLoadPreset('adventurers_guildhall')}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#262936] transition border-b border-stone-800/60"
                    >
                      <div className="text-sm font-semibold text-amber-200">
                        Level 9 Adventurer’s Guildhall
                      </div>
                      <div className="text-xs text-stone-400">
                        Vast Barracks, Armory, Teleport Circle, Theater
                      </div>
                    </button>
                    <button
                      onClick={() => handleLoadPreset('wizards_sanctum')}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#262936] transition border-b border-stone-800/60"
                    >
                      <div className="text-sm font-semibold text-amber-200">
                        Level 13 Wizard’s Sanctum
                      </div>
                      <div className="text-xs text-stone-400">
                        Arcane Study, Vast Library, Archive, Observatory
                      </div>
                    </button>
                    <button
                      onClick={() => handleLoadPreset('blank_bastion')}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#262936] transition"
                    >
                      <div className="text-sm font-semibold text-stone-300">Blank Bastion</div>
                      <div className="text-xs text-stone-400">Fresh Level 5 deed & 1,000 GP</div>
                    </button>
                  </div>
                )}
              </div>

              {/* Export / Import JSON */}
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#1c1e26] hover:bg-[#252834] text-stone-200 border border-stone-700 transition"
                title="Download Bastion JSON backup"
              >
                <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden lg:inline">Export</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#1c1e26] hover:bg-[#252834] text-stone-200 border border-stone-700 transition"
                title="Load Bastion JSON file"
              >
                <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden lg:inline">Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />

              {/* Quick Rules Drawer Button */}
              <button
                onClick={() => setRulesDrawerOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition ${
                  rulesDrawerOpen
                    ? 'bg-[#d4af37] text-[#121318] border-[#d4af37]'
                    : 'bg-[#9b2c2c]/30 hover:bg-[#9b2c2c]/50 text-amber-100 border-[#9b2c2c]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2024 Rules</span>
              </button>

              {/* Firebase Auth Profile / Sign In Button */}
              {isGuestAccount ? (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-[#d4af37] hover:bg-amber-400 text-[#121318] shadow transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Sync</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1c1e26] border border-emerald-600/40">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="text-xs font-medium text-emerald-200 max-w-[110px] truncate">
                      {user?.displayName || user?.email?.split('@')[0] || 'Player'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOutToGuest}
                    className="p-1.5 rounded-md bg-[#1c1e26] hover:bg-red-950/50 text-stone-400 hover:text-red-300 border border-stone-800 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Editable Bastion Identity & Key Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Bastion Name, Owner & Campaign Badge */}
            <div className="lg:col-span-5 space-y-2 bg-[#1c1e26] p-3.5 rounded-xl border border-stone-800/90">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#d4af37]/90">
                  Bastion Stronghold Name
                </label>
                {activeCampaignCode ? (
                  <button
                    onClick={() => setActiveTab('party')}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/70 transition"
                  >
                    <Users className="w-3 h-3" />
                    <span>Party: {activeCampaignCode}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('party')}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-800 text-stone-400 hover:text-amber-200 transition"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Join Campaign</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={bastion.bastionName}
                onChange={(e) => updateField('bastionName', e.target.value)}
                className="w-full bg-transparent text-lg sm:text-xl font-serif font-bold text-stone-100 border-b border-stone-700/80 focus:border-[#d4af37] focus:outline-none pb-0.5"
                placeholder="Enter Bastion Name..."
              />
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-xs text-stone-400 shrink-0">Lord / Lady:</span>
                <input
                  type="text"
                  value={bastion.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  className="w-full bg-transparent text-sm text-amber-100/90 border-b border-stone-800 focus:border-[#d4af37] focus:outline-none"
                  placeholder="Character Name(s)..."
                />
              </div>
            </div>

            {/* 4 Key Stat Cards */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Character Level & Facility Slots */}
              <div className="bg-[#1c1e26] p-3 rounded-xl border border-stone-800/90 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Char Level</span>
                  <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-xs text-stone-400">Lvl</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={bastion.characterLevel}
                    onChange={(e) =>
                      updateField(
                        'characterLevel',
                        Math.max(1, Math.min(20, Number(e.target.value) || 5))
                      )
                    }
                    className="w-14 bg-[#121318] border border-stone-700 rounded px-1.5 py-0.5 text-lg font-bold text-amber-200 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div className="text-[11px] text-stone-400">
                  Slots:{' '}
                  <span
                    className={`font-bold ${
                      bastion.specialFacilities.length > maxSpecialSlots
                        ? 'text-red-400'
                        : 'text-[#d4af37]'
                    }`}
                  >
                    {bastion.specialFacilities.length} / {maxSpecialSlots}
                  </span>
                </div>
              </div>

              {/* Treasury GP */}
              <div className="bg-[#1c1e26] p-3 rounded-xl border border-stone-800/90 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Treasury</span>
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-1 my-1">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={bastion.treasury}
                    onChange={(e) =>
                      updateField('treasury', Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full bg-[#121318] border border-stone-700 rounded px-1.5 py-0.5 text-lg font-bold text-amber-300 focus:border-[#d4af37] focus:outline-none"
                  />
                  <span className="text-xs font-bold text-amber-400">GP</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => updateField('treasury', bastion.treasury + 100)}
                    className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-200"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => updateField('treasury', Math.max(0, bastion.treasury - 100))}
                    className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                  >
                    -100
                  </button>
                </div>
              </div>

              {/* Bastion Defenders */}
              <div className="bg-[#1c1e26] p-3 rounded-xl border border-stone-800/90 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Defenders</span>
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <input
                    type="number"
                    min={0}
                    value={bastion.defenders}
                    onChange={(e) =>
                      updateField('defenders', Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-16 bg-[#121318] border border-stone-700 rounded px-1.5 py-0.5 text-lg font-bold text-red-200 focus:border-[#d4af37] focus:outline-none"
                  />
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/50 text-red-200">
                    {hasArmory ? 'd8 Die' : 'd6 Die'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Barrack Cap:{' '}
                  <span className="text-stone-200 font-semibold">
                    {defenderCapacity > 0 ? defenderCapacity : 'No Barrack'}
                  </span>
                </div>
              </div>

              {/* Bastion Turn Counter */}
              <div className="bg-[#1c1e26] p-3 rounded-xl border border-stone-800/90 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Bastion Turn</span>
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-xs text-stone-400">Turn</span>
                  <input
                    type="number"
                    min={1}
                    value={bastion.turnCount}
                    onChange={(e) =>
                      updateField('turnCount', Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-16 bg-[#121318] border border-stone-700 rounded px-1.5 py-0.5 text-lg font-bold text-sky-200 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div className="text-[11px] text-stone-400">
                  Elapsed: <span className="text-stone-200 font-semibold">{(bastion.turnCount - 1) * 7} Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible 2024 Bastion Rules Quick-Reference Drawer */}
        {rulesDrawerOpen && (
          <div className="bg-[#181a22] border-t border-[#d4af37]/40 px-4 sm:px-6 lg:px-8 py-5 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-serif font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  2024 Dungeon Master’s Guide — Bastion Quick Rules Reference
                </h2>
                <button
                  onClick={() => setRulesDrawerOpen(false)}
                  className="text-xs text-stone-400 hover:text-white flex items-center gap-1"
                >
                  <span>Close Reference</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs leading-relaxed">
                <div className="bg-[#121318] p-3.5 rounded-lg border border-stone-800">
                  <h3 className="font-bold text-amber-300 mb-1.5">1. Bastion Turns (Every 7 Days)</h3>
                  <p className="text-stone-300">
                    A Bastion Turn occurs roughly once every <strong>7 in-game days</strong>. If you are at your Bastion, you issue specific <strong>Orders</strong> (Craft, Empower, Harvest, Recruit, Research, Trade) to your Special Facilities. If you are away adventuring, your Bastion takes the <strong>Maintain Order</strong> and rolls d100 on the Bastion Events table.
                  </p>
                </div>
                <div className="bg-[#121318] p-3.5 rounded-lg border border-stone-800">
                  <h3 className="font-bold text-amber-300 mb-1.5">2. Special Facility Scaling</h3>
                  <ul className="text-stone-300 space-y-1">
                    <li>• <strong>Level 5:</strong> 2 Special Facilities (2 Basic free)</li>
                    <li>• <strong>Level 9:</strong> 4 Special Facilities</li>
                    <li>• <strong>Level 13:</strong> 5 Special Facilities</li>
                    <li>• <strong>Level 17:</strong> 6 Special Facilities</li>
                    <li className="text-stone-400 italic pt-0.5">
                      Gaining new Special Facilities on level-up costs 0 GP.
                    </li>
                  </ul>
                </div>
                <div className="bg-[#121318] p-3.5 rounded-lg border border-stone-800">
                  <h3 className="font-bold text-amber-300 mb-1.5">3. Basic Facilities & Enlarging</h3>
                  <ul className="text-stone-300 space-y-1">
                    <li>• <strong>Cramped (4 sq / 100 sq ft):</strong> 500 GP, 20 days</li>
                    <li>• <strong>Roomy (16 sq / 400 sq ft):</strong> 1,000 GP, 45 days</li>
                    <li>• <strong>Vast (36 sq / 900 sq ft):</strong> 3,000 GP, 125 days</li>
                    <li>• <strong>Enlarge Cramped → Roomy:</strong> 500 GP, 25 days</li>
                    <li>• <strong>Enlarge Roomy → Vast:</strong> 2,000 GP, 80 days (Specials cost 2,000 GP)</li>
                  </ul>
                </div>
                <div className="bg-[#121318] p-3.5 rounded-lg border border-stone-800">
                  <h3 className="font-bold text-amber-300 mb-1.5">4. Attacks & Combining Bastions</h3>
                  <p className="text-stone-300">
                    During an <strong>Attack</strong> event, roll <strong>6d6</strong> (or <strong>6d8</strong> with a stocked Armory). Each <strong>1</strong> kills 1 Bastion Defender. If you have 0 Defenders, a random Special Facility is damaged and shut down until repaired (1 Bastion Turn). Party members may combine Bastions into a single shared stronghold!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================================== */}
      {/* PRIMARY NAVIGATION TABS                                              */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-30 bg-[#121318]/95 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto">
          <div className="flex space-x-1 sm:space-x-2 py-2">
            <button
              onClick={() => setActiveTab('blueprint')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                activeTab === 'blueprint'
                  ? 'bg-[#d4af37] text-[#121318] shadow-md shadow-[#d4af37]/20'
                  : 'text-stone-300 hover:bg-[#1c1e26] hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Blueprint & Facilities</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'blueprint'
                    ? 'bg-[#121318]/20 text-[#121318]'
                    : 'bg-stone-800 text-stone-300'
                }`}
              >
                {bastion.specialFacilities.length + bastion.basicFacilities.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                activeTab === 'catalog'
                  ? 'bg-[#d4af37] text-[#121318] shadow-md shadow-[#d4af37]/20'
                  : 'text-stone-300 hover:bg-[#1c1e26] hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>2024 Compendium</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'catalog'
                    ? 'bg-[#121318]/20 text-[#121318]'
                    : 'bg-stone-800 text-stone-300'
                }`}
              >
                {SPECIAL_FACILITIES_CATALOG.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('turns')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                activeTab === 'turns'
                  ? 'bg-[#d4af37] text-[#121318] shadow-md shadow-[#d4af37]/20'
                  : 'text-stone-300 hover:bg-[#1c1e26] hover:text-white'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>Bastion Turn & Events</span>
            </button>

            <button
              onClick={() => setActiveTab('chronicle')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                activeTab === 'chronicle'
                  ? 'bg-[#d4af37] text-[#121318] shadow-md shadow-[#d4af37]/20'
                  : 'text-stone-300 hover:bg-[#1c1e26] hover:text-white'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>Chronicle</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'chronicle'
                    ? 'bg-[#121318]/20 text-[#121318]'
                    : 'bg-stone-800 text-stone-300'
                }`}
              >
                {bastion.chronicle.length}
              </span>
            </button>

            {/* NEW: MULTIPLAYER PARTY & CAMPAIGN LEDGER TAB */}
            <button
              onClick={() => setActiveTab('party')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                activeTab === 'party'
                  ? 'bg-[#d4af37] text-[#121318] shadow-md shadow-[#d4af37]/20'
                  : 'text-stone-300 hover:bg-[#1c1e26] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Party & Campaign Sync</span>
              {activeCampaignCode && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                    activeTab === 'party'
                      ? 'bg-[#121318]/20 text-[#121318]'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                  }`}
                >
                  {campaignBastions.length}
                </span>
              )}
            </button>
          </div>

          {/* DM Override Toggle */}
          <div className="hidden md:flex items-center gap-2 pl-4">
            <button
              onClick={() => updateField('dmOverride', !bastion.dmOverride)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition ${
                bastion.dmOverride
                  ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
                  : 'bg-[#1c1e26] border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title="Bypass level limits, slot caps, and treasury restrictions"
            >
              {bastion.dmOverride ? (
                <Unlock className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>DM Override: {bastion.dmOverride ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA                                                    */}
      {/* ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: INTERACTIVE BLUEPRINT / FLOORPLAN & FACILITY MANAGER        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'blueprint' && (
          <div className="space-y-6">
            {/* Floorplan Spatial Telemetry & Visual Grid Overview */}
            <section className="bg-[#1c1e26] rounded-xl border border-[#d4af37]/30 p-5 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#d4af37]" />
                    Architectural Floorplan & Spatial Footprint
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Each grid square represents a 5-foot × 5-foot battlemap tile (25 sq. ft.).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-[#121318] border border-stone-800">
                    <span className="text-stone-400">Total Area: </span>
                    <span className="font-bold text-[#d4af37]">
                      {floorplanStats.totalSquares} squares ({floorplanStats.totalSqFt.toLocaleString()} sq ft)
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-[#121318] border border-stone-800">
                    <span className="text-stone-400">Staff: </span>
                    <span className="font-bold text-amber-200">{totalHirelings} Hirelings</span>
                  </div>
                  <button
                    onClick={() => updateField('dmOverride', !bastion.dmOverride)}
                    className={`md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                      bastion.dmOverride
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-[#121318] border-stone-800 text-stone-400'
                    }`}
                  >
                    {bastion.dmOverride ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>DM Override</span>
                  </button>
                </div>
              </div>

              {/* Proportional Visual Floorplan Blueprint Canvas */}
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wider font-bold text-stone-400 mb-2 flex items-center justify-between">
                  <span>Proportional Room Layout Blueprint</span>
                  <span className="text-stone-500">
                    Cramped = 2×2 (4 sq) • Roomy = 4×4 (16 sq) • Vast = 6×6 (36 sq)
                  </span>
                </div>

                {bastion.specialFacilities.length === 0 && bastion.basicFacilities.length === 0 ? (
                  <div className="p-8 rounded-lg border border-dashed border-stone-700 text-center text-stone-400 text-sm">
                    Your Bastion blueprint is currently empty. Add Special or Basic facilities to populate the floorplan.
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-xl bg-[#121318] border border-stone-800/90 flex flex-wrap gap-3 items-start"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, rgba(212, 175, 55, 0.12) 1px, transparent 1px)',
                      backgroundSize: '16px 16px',
                    }}
                  >
                    {/* Render Special Facilities proportionally */}
                    {bastion.specialFacilities.map((inst) => {
                      const cat = SPECIAL_FACILITIES_CATALOG.find((c) => c.id === inst.catalogId);
                      const spec = SPACE_SPECS[inst.space] || SPACE_SPECS.Roomy;
                      const sizeClasses =
                        inst.space === 'Vast'
                          ? 'w-full sm:w-64 min-h-[124px]'
                          : inst.space === 'Roomy'
                          ? 'w-full sm:w-48 min-h-[96px]'
                          : 'w-40 min-h-[76px]';

                      return (
                        <div
                          key={inst.uid}
                          className={`${sizeClasses} p-3 rounded-lg border transition relative flex flex-col justify-between ${
                            inst.damaged
                              ? 'bg-red-950/35 border-red-500/70'
                              : 'bg-gradient-to-br from-[#232631] to-[#191b23] border-[#d4af37]/50 hover:border-[#d4af37]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-serif font-bold text-amber-100 leading-tight">
                              {inst.customName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#121318]/80 text-[#d4af37] shrink-0">
                              {spec.squares}sq
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-1">
                            <span className="text-[10px] text-stone-400 truncate">
                              {cat?.name} • {inst.space}
                            </span>
                            {inst.damaged ? (
                              <span className="text-[10px] font-bold text-red-300 uppercase">
                                Damaged
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-300/90">
                                {inst.assignedOrder}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Render Basic Facilities proportionally */}
                    {bastion.basicFacilities.map((bf) => {
                      const spec = SPACE_SPECS[bf.space] || SPACE_SPECS.Cramped;
                      const sizeClasses =
                        bf.space === 'Vast'
                          ? 'w-full sm:w-60 min-h-[112px]'
                          : bf.space === 'Roomy'
                          ? 'w-44 min-h-[88px]'
                          : 'w-36 min-h-[72px]';

                      return (
                        <div
                          key={bf.uid}
                          className={`${sizeClasses} p-2.5 rounded-lg border border-stone-700/80 bg-[#181a21]/90 flex flex-col justify-between`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-medium text-stone-200 leading-tight">
                              {bf.customName}
                            </span>
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-stone-900 text-stone-400 shrink-0">
                              {spec.squares}sq
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-500 mt-2">
                            Basic • {bf.space}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Sub-Tabs for Special vs Basic Facilities */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg bg-[#1c1e26] p-1 border border-stone-800">
                <button
                  onClick={() => setFacilitySubTab('special')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 ${
                    facilitySubTab === 'special'
                      ? 'bg-[#9b2c2c] text-white shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Special Facilities ({bastion.specialFacilities.length}/{maxSpecialSlots})
                  </span>
                </button>
                <button
                  onClick={() => setFacilitySubTab('basic')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 ${
                    facilitySubTab === 'basic'
                      ? 'bg-[#9b2c2c] text-white shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <span>Basic Facilities ({bastion.basicFacilities.length})</span>
                </button>
              </div>

              {facilitySubTab === 'special' && (
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#d4af37] hover:bg-amber-400 text-[#121318] transition shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Special Facility from Compendium</span>
                </button>
              )}
            </div>

            {/* SPECIAL FACILITIES MANAGER */}
            {facilitySubTab === 'special' && (
              <div className="space-y-4">
                {bastion.specialFacilities.length === 0 ? (
                  <div className="bg-[#1c1e26] rounded-xl border border-stone-800 p-10 text-center">
                    <Castle className="w-10 h-10 text-[#d4af37]/60 mx-auto mb-3" />
                    <h3 className="text-lg font-serif font-bold text-stone-200">
                      No Special Facilities Built Yet
                    </h3>
                    <p className="text-sm text-stone-400 max-w-md mx-auto mt-1 mb-4">
                      At Level {bastion.characterLevel}, your Bastion supports up to{' '}
                      <strong>{maxSpecialSlots}</strong> Special Facilities at no initial gold cost.
                    </p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d4af37] text-[#121318] font-semibold text-sm hover:bg-amber-400 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Browse 2024 Special Facilities</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {bastion.specialFacilities.map((inst) => {
                      const cat = SPECIAL_FACILITIES_CATALOG.find((c) => c.id === inst.catalogId);
                      if (!cat) return null;
                      const spaceInfo = SPACE_SPECS[inst.space];

                      return (
                        <div
                          key={inst.uid}
                          className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                            inst.damaged
                              ? 'bg-red-950/20 border-red-500/60'
                              : 'bg-[#1c1e26] border-stone-800 hover:border-[#d4af37]/40'
                          }`}
                        >
                          <div>
                            {/* Card Header: Editable Title + Badges */}
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-800/80">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                                    Lvl {cat.level} • {cat.name}
                                  </span>
                                  <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${spaceInfo.color}`}
                                  >
                                    {inst.space} ({spaceInfo.squares} sq)
                                  </span>
                                  {inst.damaged && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-900/70 text-red-100 border border-red-500 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Shut Down / Damaged
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={inst.customName}
                                  onChange={(e) =>
                                    handleUpdateSpecialFacility(inst.uid, {
                                      customName: e.target.value,
                                    })
                                  }
                                  className="w-full bg-transparent text-lg font-serif font-bold text-stone-100 focus:text-amber-200 focus:outline-none border-b border-transparent focus:border-[#d4af37]"
                                  aria-label="Custom facility name"
                                />
                              </div>

                              <button
                                onClick={() => handleRemoveSpecialFacility(inst.uid)}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-950/30 transition"
                                title="Demolish / Remove Facility"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Mechanical Summary */}
                            <p className="text-xs text-stone-300 leading-relaxed mt-3">
                              {cat.summary}
                            </p>

                            {/* Hireling Assignment Input */}
                            <div className="mt-3 bg-[#121318] p-2.5 rounded-lg border border-stone-800/90 flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#d4af37] shrink-0" />
                              <input
                                type="text"
                                value={inst.hirelingNotes}
                                onChange={(e) =>
                                  handleUpdateSpecialFacility(inst.uid, {
                                    hirelingNotes: e.target.value,
                                  })
                                }
                                placeholder="Assign hireling names or notes..."
                                className="w-full bg-transparent text-xs text-stone-200 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Card Footer: Turn Order Selector + Enlarge + Damage Toggle */}
                          <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-400">Turn Order:</span>
                              <select
                                value={inst.assignedOrder}
                                disabled={inst.damaged}
                                onChange={(e) =>
                                  handleUpdateSpecialFacility(inst.uid, {
                                    assignedOrder: e.target.value,
                                  })
                                }
                                className="bg-[#121318] border border-stone-700 rounded-md px-2.5 py-1 text-xs font-semibold text-amber-200 focus:border-[#d4af37] focus:outline-none disabled:opacity-50"
                              >
                                {cat.orders.map((ord) => (
                                  <option key={ord} value={ord}>
                                    {ord}
                                  </option>
                                ))}
                                <option value="Idle">Idle (No Order)</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              {cat.canEnlarge && inst.space === 'Roomy' && (
                                <button
                                  onClick={() => handleEnlargeSpecialFacility(inst.uid)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-600/50 transition"
                                  title={cat.enlargeDesc}
                                >
                                  <ArrowUpCircle className="w-3.5 h-3.5" />
                                  <span>Enlarge (2,000 GP)</span>
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleUpdateSpecialFacility(inst.uid, { damaged: !inst.damaged })
                                }
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                                  inst.damaged
                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 hover:bg-emerald-900/60'
                                    : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:border-red-500/50 hover:text-red-200'
                                }`}
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>{inst.damaged ? 'Repair Facility' : 'Mark Damaged'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* BASIC FACILITIES MANAGER */}
            {facilitySubTab === 'basic' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Add New Basic Facility Form */}
                <form
                  onSubmit={handleAddBasicFacility}
                  className="lg:col-span-4 bg-[#1c1e26] rounded-xl border border-stone-800 p-5 space-y-4 h-fit"
                >
                  <h3 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#d4af37]" />
                    Construct Basic Facility
                  </h3>
                  <p className="text-xs text-stone-400">
                    Basic facilities provide living quarters, kitchens, and courtyards. Upgrading size expands floorplan space.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Facility Type
                    </label>
                    <select
                      value={newBasicType}
                      onChange={(e) => setNewBasicType(e.target.value)}
                      className="w-full bg-[#121318] border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                    >
                      {BASIC_FACILITY_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Space Size & 2024 DMG Cost
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(SPACE_SPECS).map((spec) => (
                        <button
                          type="button"
                          key={spec.name}
                          onClick={() => setNewBasicSpace(spec.name)}
                          className={`p-2 rounded-lg border text-left transition ${
                            newBasicSpace === spec.name
                              ? 'bg-[#d4af37]/20 border-[#d4af37] text-amber-100'
                              : 'bg-[#121318] border-stone-800 text-stone-400 hover:border-stone-600'
                          }`}
                        >
                          <div className="text-xs font-bold">{spec.name}</div>
                          <div className="text-[10px]">{spec.squares} sq</div>
                          <div className="text-[10px] text-amber-300/90 mt-0.5">
                            {spec.buildCost.toLocaleString()} GP
                          </div>
                          <div className="text-[10px] text-stone-500">{spec.buildDays} days</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Custom Room Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newBasicName}
                      onChange={(e) => setNewBasicName(e.target.value)}
                      placeholder="e.g., Great Banquet Hall"
                      className="w-full bg-[#121318] border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deductGoldOnBuild}
                      onChange={(e) => setDeductGoldOnBuild(e.target.checked)}
                      className="rounded border-stone-600 bg-[#121318] text-[#d4af37]"
                    />
                    <span>Deduct GP cost from Bastion Treasury</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#121318] font-bold text-sm transition shadow-md"
                  >
                    Add Basic Facility
                  </button>
                </form>

                {/* Right: Existing Basic Facilities List */}
                <div className="lg:col-span-8 space-y-3">
                  {bastion.basicFacilities.length === 0 ? (
                    <div className="bg-[#1c1e26] rounded-xl border border-stone-800 p-8 text-center text-stone-400 text-sm">
                      No Basic Facilities constructed yet.
                    </div>
                  ) : (
                    bastion.basicFacilities.map((bf) => {
                      const typeInfo =
                        BASIC_FACILITY_TYPES.find((t) => t.id === bf.typeId) ||
                        BASIC_FACILITY_TYPES[0];
                      const spec = SPACE_SPECS[bf.space];

                      return (
                        <div
                          key={bf.uid}
                          className="bg-[#1c1e26] rounded-xl border border-stone-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-serif font-bold text-stone-100">
                                {bf.customName}
                              </h4>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${spec.color}`}
                              >
                                {spec.name} ({spec.squares} sq / {spec.sqFt} sq ft)
                              </span>
                            </div>
                            <p className="text-xs text-stone-400 mt-1">{typeInfo.desc}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {spec.nextSize && (
                              <button
                                onClick={() => handleEnlargeBasicFacility(bf.uid)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-600/50 transition"
                              >
                                <ArrowUpCircle className="w-3.5 h-3.5" />
                                <span>
                                  Enlarge → {spec.nextSize} ({spec.enlargeCost.toLocaleString()} GP /{' '}
                                  {spec.enlargeDays}d)
                                </span>
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveBasicFacility(bf.uid)}
                              className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-950/30 transition"
                              title="Remove Basic Facility"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: 2024 SPECIAL FACILITY COMPENDIUM & BUILDER                  */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'catalog' && (
          <div className="space-y-5">
            {/* Filter & Search Bar */}
            <div className="bg-[#1c1e26] rounded-xl border border-stone-800 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search 2024 Special Facilities by name, prerequisite, or effect..."
                  className="w-full bg-[#121318] border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={catalogLevelFilter}
                  onChange={(e) => setCatalogLevelFilter(e.target.value)}
                  className="bg-[#121318] border border-stone-700 rounded-lg px-3 py-2 text-xs font-semibold text-stone-200 focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="ALL">All Level Tiers</option>
                  <option value="5">Level 5 Facilities</option>
                  <option value="9">Level 9 Facilities</option>
                  <option value="13">Level 13 Facilities</option>
                  <option value="17">Level 17 Facilities</option>
                </select>

                <select
                  value={catalogOrderFilter}
                  onChange={(e) => setCatalogOrderFilter(e.target.value)}
                  className="bg-[#121318] border border-stone-700 rounded-lg px-3 py-2 text-xs font-semibold text-stone-200 focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="ALL">All Bastion Orders</option>
                  <option value="Craft">Order: Craft</option>
                  <option value="Empower">Order: Empower</option>
                  <option value="Harvest">Order: Harvest</option>
                  <option value="Recruit">Order: Recruit</option>
                  <option value="Research">Order: Research</option>
                  <option value="Trade">Order: Trade</option>
                </select>

                <div className="px-3 py-2 rounded-lg bg-[#121318] border border-stone-800 text-xs text-stone-300">
                  Slots Used:{' '}
                  <strong className="text-[#d4af37]">
                    {bastion.specialFacilities.length} / {maxSpecialSlots}
                  </strong>
                </div>
              </div>
            </div>

            {/* Catalog Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalog.map((item) => {
                const levelLocked = bastion.characterLevel < item.level;
                const slotsFull = bastion.specialFacilities.length >= maxSpecialSlots;
                const blocked = !bastion.dmOverride && (levelLocked || slotsFull);
                const alreadyOwnedCount = bastion.specialFacilities.filter(
                  (f) => f.catalogId === item.id
                ).length;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-5 flex flex-col justify-between transition ${
                      levelLocked && !bastion.dmOverride
                        ? 'bg-[#16181f] border-stone-800/70 opacity-80'
                        : 'bg-[#1c1e26] border-stone-800 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            levelLocked
                              ? 'bg-red-950/50 text-red-300 border-red-700/50'
                              : 'bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/40'
                          }`}
                        >
                          Level {item.level}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {item.orders.map((ord) => (
                            <span
                              key={ord}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                ORDER_BADGES[ord] || 'bg-stone-800 text-stone-200'
                              }`}
                            >
                              {ord}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-serif font-bold text-stone-100">{item.name}</h3>
                        {alreadyOwnedCount > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-600/40">
                            Built ×{alreadyOwnedCount}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mt-1.5 pb-2.5 border-b border-stone-800/80">
                        <span>
                          Space: <strong className="text-stone-200">{item.space}</strong> (
                          {SPACE_SPECS[item.space].squares} sq)
                        </span>
                        <span>•</span>
                        <span>
                          Hirelings: <strong className="text-stone-200">{item.hirelings}</strong>
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <span className="text-[11px] text-stone-400">
                          <strong className="text-stone-300">Prerequisite:</strong>{' '}
                          {item.prerequisite === 'None' ? (
                            <span className="text-stone-400">None</span>
                          ) : (
                            <span className="text-amber-200/90">{item.prerequisite}</span>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-stone-300 leading-relaxed mt-2.5">
                        {item.summary}
                      </p>

                      {item.canEnlarge && (
                        <div className="mt-2 text-[11px] text-emerald-300/90 bg-emerald-950/30 border border-emerald-800/40 rounded px-2 py-1">
                          {item.enlargeDesc}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800/80">
                      <button
                        onClick={() => handleAddSpecialFacility(item)}
                        disabled={blocked}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          blocked
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : 'bg-[#d4af37] hover:bg-amber-400 text-[#121318] shadow'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {levelLocked && !bastion.dmOverride
                            ? `Requires Level ${item.level}`
                            : slotsFull && !bastion.dmOverride
                            ? `Slot Limit Reached (${maxSpecialSlots}/${maxSpecialSlots})`
                            : 'Construct in Bastion'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: BASTION TURN & ORDERS SIMULATOR                             */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'turns' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Issue Orders to Active Special Facilities */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#1c1e26] rounded-xl border border-[#d4af37]/30 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                      Turn {bastion.turnCount} • Days {(bastion.turnCount - 1) * 7 + 1}–
                      {bastion.turnCount * 7}
                    </span>
                    <h2 className="text-lg font-serif font-bold text-stone-100">
                      Active Bastion Turn — Facility Orders
                    </h2>
                    <p className="text-xs text-stone-400">
                      Assign an order to each Special Facility when you are present at your Bastion.
                    </p>
                  </div>

                  <button
                    onClick={handleResolveActiveTurn}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#121318] font-bold text-sm transition shadow-lg shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolve Turn {bastion.turnCount}</span>
                  </button>
                </div>

                {/* Facility Order Rows */}
                <div className="mt-4 space-y-3">
                  {bastion.specialFacilities.length === 0 ? (
                    <div className="p-6 text-center text-sm text-stone-400 border border-dashed border-stone-700 rounded-lg">
                      No Special Facilities constructed. Add facilities to issue Bastion Orders.
                    </div>
                  ) : (
                    bastion.specialFacilities.map((inst) => {
                      const cat = SPECIAL_FACILITIES_CATALOG.find((c) => c.id === inst.catalogId);
                      if (!cat) return null;

                      return (
                        <div
                          key={inst.uid}
                          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            inst.damaged
                              ? 'bg-red-950/20 border-red-500/50'
                              : 'bg-[#121318] border-stone-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-stone-100 text-sm">
                                {inst.customName}
                              </span>
                              <span className="text-[11px] text-stone-400">({cat.name})</span>
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                              {cat.summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {inst.damaged ? (
                              <span className="text-xs font-bold text-red-400 px-2.5 py-1 rounded bg-red-950/50 border border-red-700/50">
                                Shut Down
                              </span>
                            ) : (
                              <select
                                value={inst.assignedOrder}
                                onChange={(e) =>
                                  handleUpdateSpecialFacility(inst.uid, {
                                    assignedOrder: e.target.value,
                                  })
                                }
                                className="bg-[#1c1e26] border border-[#d4af37]/40 rounded-lg px-3 py-1.5 text-xs font-bold text-amber-200 focus:outline-none"
                              >
                                {cat.orders.map((ord) => (
                                  <option key={ord} value={ord}>
                                    Order: {ord}
                                  </option>
                                ))}
                                <option value="Idle">Idle</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Maintain Order & 2024 DMG d100 Bastion Events Simulator */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-gradient-to-b from-[#1e2029] to-[#171920] rounded-xl border border-[#9b2c2c]/60 p-5 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-300 mb-1">
                  <Flame className="w-4 h-4 text-[#9b2c2c]" />
                  <span>Away Adventuring</span>
                </div>
                <h2 className="text-lg font-serif font-bold text-stone-100">
                  Issue Maintain Order (Bastion Events)
                </h2>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  When you do not visit your Bastion during a 7-day turn, your hirelings execute the{' '}
                  <strong>Maintain Order</strong> and the DM rolls <strong>d100</strong> on the 2024 DMG Bastion Events Table.
                </p>

                <button
                  onClick={triggerMaintainEventRoll}
                  disabled={isRollingEvent}
                  className="mt-4 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#9b2c2c] to-red-800 hover:from-red-800 hover:to-red-700 text-amber-100 font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg border border-red-500/40 transition disabled:opacity-60"
                >
                  <Dices className={`w-5 h-5 ${isRollingEvent ? 'animate-spin' : ''}`} />
                  <span>
                    {isRollingEvent
                      ? 'Rolling d100 Fate...'
                      : `Roll d100 Bastion Event (Turn ${bastion.turnCount})`}
                  </span>
                </button>

                {/* Animated d100 Display & Event Outcome Card */}
                {(isRollingEvent || activeEventResult) && (
                  <div className="mt-5 p-4 rounded-xl bg-[#121318] border border-[#d4af37]/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-bold text-stone-400">
                        d100 Outcome
                      </span>
                      <span className="text-2xl font-serif font-extrabold text-[#d4af37] px-3 py-1 rounded-lg bg-[#1c1e26] border border-[#d4af37]/40">
                        {animatedRollNumber}
                      </span>
                    </div>

                    {activeEventResult && !isRollingEvent && (
                      <div className="space-y-3 pt-2 border-t border-stone-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                activeEventResult.event.severity === 'danger'
                                  ? 'bg-red-900/70 text-red-100'
                                  : activeEventResult.event.severity === 'warning'
                                  ? 'bg-amber-900/70 text-amber-100'
                                  : activeEventResult.event.severity === 'epic'
                                  ? 'bg-purple-900/70 text-purple-100'
                                  : activeEventResult.event.severity === 'good'
                                  ? 'bg-emerald-900/70 text-emerald-100'
                                  : 'bg-stone-800 text-stone-200'
                              }`}
                            >
                              {activeEventResult.event.min === activeEventResult.event.max
                                ? `${activeEventResult.event.min}`
                                : `${String(activeEventResult.event.min).padStart(2, '0')}–${
                                    activeEventResult.event.max === 100
                                      ? '00'
                                      : String(activeEventResult.event.max).padStart(2, '0')
                                  }`}
                            </span>
                            <h3 className="text-base font-serif font-bold text-amber-200">
                              {activeEventResult.event.title}
                            </h3>
                          </div>
                          <p className="text-xs text-stone-300 leading-relaxed mt-2">
                            {activeEventResult.event.summary}
                          </p>
                        </div>

                        {/* Interactive Resolution Controls */}
                        {!activeEventResult.resolved ? (
                          <div className="pt-2 space-y-2">
                            {activeEventResult.event.effectType === 'attack' && (
                              <div className="p-3 rounded-lg bg-red-950/30 border border-red-700/50 space-y-2">
                                <div className="text-xs text-red-200 font-semibold">
                                  6d{activeEventResult.dieSides} Defense Roll:{' '}
                                  <span className="font-mono text-amber-200">
                                    [{activeEventResult.attackDice.join(', ')}]
                                  </span>{' '}
                                  → <strong>{activeEventResult.attackLosses}</strong> casualty{' '}
                                  {activeEventResult.attackLosses === 1 ? 'die' : 'dice'} (1s)
                                </div>
                                <button
                                  onClick={() => applyEventResolution('default')}
                                  className="w-full py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition"
                                >
                                  Apply Attack Casualties & Advance Turn
                                </button>
                              </div>
                            )}

                            {activeEventResult.event.effectType === 'criminal' && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => applyEventResolution('bribe')}
                                  className="py-2 px-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold"
                                >
                                  Pay {activeEventResult.goldRoll} GP Bribe
                                </button>
                                <button
                                  onClick={() => applyEventResolution('surrender')}
                                  className="py-2 px-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-100 text-xs font-bold"
                                >
                                  Surrender Hireling
                                </button>
                              </div>
                            )}

                            {activeEventResult.event.effectType === 'opportunity' && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => applyEventResolution('invest')}
                                  className="py-2 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                                >
                                  Spend 500 GP to Host
                                </button>
                                <button
                                  onClick={() => applyEventResolution('decline')}
                                  className="py-2 px-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-100 text-xs font-bold"
                                >
                                  Decline Offer
                                </button>
                              </div>
                            )}

                            {activeEventResult.event.effectType === 'guest' && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => applyEventResolution('gift')}
                                  className="py-2 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                                >
                                  Accept Envoy Gift
                                </button>
                                <button
                                  onClick={() => applyEventResolution('refuge')}
                                  className="py-2 px-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold"
                                >
                                  Grant Refuge (+2 Def)
                                </button>
                              </div>
                            )}

                            {activeEventResult.event.effectType === 'lost_hirelings' && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => applyEventResolution('rehire')}
                                  className="py-2 px-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold"
                                >
                                  Spend 100 GP to Rehire
                                </button>
                                <button
                                  onClick={() => applyEventResolution('shutdown')}
                                  className="py-2 px-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-100 text-xs font-bold"
                                >
                                  Let Facility Shut Down
                                </button>
                              </div>
                            )}

                            {['none', 'visitors', 'magic', 'refugees', 'aid', 'treasure'].includes(
                              activeEventResult.event.effectType
                            ) && (
                              <button
                                onClick={() => applyEventResolution('default')}
                                className="w-full py-2 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#121318] text-xs font-bold transition"
                              >
                                Resolve Event & Advance to Turn {bastion.turnCount + 1}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/40 text-xs text-emerald-200 flex items-start gap-2">
                            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                            <span>{activeEventResult.resolutionNote}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Compact Reference Table of 2024 Bastion Events */}
              <div className="bg-[#1c1e26] rounded-xl border border-stone-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                  2024 DMG Bastion Events Table (d100)
                </h3>
                <div className="space-y-1 text-xs">
                  {BASTION_EVENTS_TABLE.map((row) => (
                    <div
                      key={row.title}
                      className="flex items-center justify-between py-1 px-2 rounded bg-[#121318]/70 border border-stone-800/60"
                    >
                      <span className="font-mono text-[#d4af37]">
                        {row.min === row.max
                          ? row.min
                          : `${String(row.min).padStart(2, '0')}–${
                              row.max === 100 ? '00' : String(row.max).padStart(2, '0')
                            }`}
                      </span>
                      <span className="font-medium text-stone-200">{row.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: CAMPAIGN CHRONICLE & TURN HISTORY LOG                       */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'chronicle' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add Custom DM / Session Note */}
            <form
              onSubmit={handleAddCustomNote}
              className="lg:col-span-4 bg-[#1c1e26] rounded-xl border border-stone-800 p-5 space-y-3 h-fit"
            >
              <h2 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#d4af37]" />
                Record Chronicle Entry
              </h2>
              <p className="text-xs text-stone-400">
                Log custom session events, crafted magic items, NPC alliances, or DM rulings.
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Entry Headline
                </label>
                <input
                  type="text"
                  value={customNoteTitle}
                  onChange={(e) => setCustomNoteTitle(e.target.value)}
                  placeholder="e.g., Forged +1 Longsword in Smithy"
                  className="w-full bg-[#121318] border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Details & Mechanical Notes
                </label>
                <textarea
                  rows={4}
                  value={customNoteBody}
                  onChange={(e) => setCustomNoteBody(e.target.value)}
                  placeholder="Write chronicle details..."
                  className="w-full bg-[#121318] border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#121318] font-bold text-sm transition"
              >
                Append to Chronicle
              </button>
            </form>

            {/* Timeline Log Feed */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-bold text-stone-100">
                  Stronghold History & Turn Ledger
                </h2>
                <span className="text-xs text-stone-400">
                  {bastion.chronicle.length} recorded entries
                </span>
              </div>

              {bastion.chronicle.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#1c1e26] rounded-xl border border-stone-800 p-4 flex gap-3.5"
                >
                  <div className="mt-0.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        entry.type === 'event'
                          ? 'bg-red-950/60 border-red-700/60 text-red-300'
                          : entry.type === 'build'
                          ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                          : entry.type === 'turn'
                          ? 'bg-amber-950/60 border-[#d4af37]/60 text-[#d4af37]'
                          : 'bg-sky-950/60 border-sky-700/60 text-sky-300'
                      }`}
                    >
                      {entry.type === 'event' ? (
                        <Dices className="w-4 h-4" />
                      ) : entry.type === 'build' ? (
                        <Hammer className="w-4 h-4" />
                      ) : entry.type === 'turn' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <ScrollText className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-serif font-bold text-stone-100 text-sm">
                        {entry.title}
                      </h3>
                      <span className="text-[11px] font-mono text-stone-400">
                        Turn {entry.turn} • {entry.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed mt-1">{entry.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: MULTIPLAYER PARTY & CAMPAIGN SYNC LEDGER                    */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'party' && (
          <div className="space-y-6">
            {/* Top Campaign Connection & Invite Banner */}
            <section className="bg-[#1c1e26] rounded-xl border border-[#d4af37]/40 p-5 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-6 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                    <Users className="w-4 h-4" />
                    <span>Real-Time Party Synchronization</span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-stone-100">
                    Shared Campaign Bastion Ledger
                  </h2>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Link your active Bastion to a <strong>Campaign Code</strong> so every player and the Dungeon Master can view each other’s strongholds, facility orders, defenders, and recent Bastion Events in real time.
                  </p>
                </div>

                {/* Join or Create Campaign Controls */}
                <div className="lg:col-span-6">
                  {activeCampaignCode ? (
                    <div className="p-4 rounded-xl bg-[#121318] border border-emerald-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live Synced Campaign</span>
                        </div>
                        <div className="text-2xl font-mono font-extrabold tracking-widest text-amber-200 mt-0.5">
                          {activeCampaignCode}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          Linked Stronghold: <strong>{bastion.bastionName}</strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleCopyInviteLink}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#121318] font-bold text-xs transition shadow"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code & Invite</span>
                        </button>
                        <button
                          onClick={handleLeaveCampaign}
                          className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-red-950/60 text-stone-300 hover:text-red-200 border border-stone-700 text-xs font-semibold transition"
                        >
                          Unlink
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#121318] border border-stone-800 space-y-3">
                      <form onSubmit={handleJoinCampaign} className="flex gap-2">
                        <input
                          type="text"
                          value={campaignCodeInput}
                          onChange={(e) =>
                            setCampaignCodeInput(normalizeCampaignCode(e.target.value))
                          }
                          placeholder="Enter Party Code (e.g. FAERUN)"
                          className="flex-1 bg-[#1c1e26] border border-stone-700 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-wider text-amber-100 focus:border-[#d4af37] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-amber-400 text-[#121318] font-bold text-xs transition shrink-0"
                        >
                          Join Party
                        </button>
                      </form>

                      <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                        <span>Starting a new campaign for your group?</span>
                        <button
                          type="button"
                          onClick={handleCreateNewCampaign}
                          className="text-[#d4af37] hover:underline font-bold flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Campaign Code</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Party Bastions Live Grid */}
            {activeCampaignCode && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-[#d4af37]" />
                    <span>
                      Party Strongholds in “{activeCampaignCode}” ({campaignBastions.length})
                    </span>
                  </h3>
                  <span className="text-xs text-stone-400">
                    Click any party member’s Bastion to inspect their facilities & chronicle
                  </span>
                </div>

                {campaignBastions.length === 0 ? (
                  <div className="bg-[#1c1e26] rounded-xl border border-stone-800 p-8 text-center text-sm text-stone-400">
                    Syncing your Bastion to <strong>{activeCampaignCode}</strong>... Share this code with your party members so their strongholds appear here!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaignBastions.map((partyItem) => {
                      const isOwn = user && partyItem.ownerUid === user.uid;
                      const specials = partyItem.specialFacilities || [];
                      const latestEvent = (partyItem.chronicle || [])[0];

                      return (
                        <div
                          key={partyItem.sharedDocId}
                          className={`rounded-xl border p-5 flex flex-col justify-between transition ${
                            isOwn
                              ? 'bg-[#1f222c] border-[#d4af37]/60 shadow-lg'
                              : 'bg-[#1c1e26] border-stone-800 hover:border-[#d4af37]/40'
                          }`}
                        >
                          <div>
                            {/* Header Badges */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                                Level {partyItem.characterLevel || 5} • Turn{' '}
                                {partyItem.turnCount || 1}
                              </span>
                              {isOwn ? (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-600/40">
                                  Your Bastion
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 truncate max-w-[110px]">
                                  {partyItem.ownerDisplayName || 'Party Member'}
                                </span>
                              )}
                            </div>

                            <h4 className="text-lg font-serif font-bold text-stone-100">
                              {partyItem.bastionName}
                            </h4>
                            <p className="text-xs text-amber-200/85 mb-3">
                              Lord / Lady: <strong>{partyItem.ownerName}</strong>
                            </p>

                            {/* Treasury & Defenders Pill Row */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="px-2.5 py-1.5 rounded-lg bg-[#121318] border border-stone-800 flex items-center justify-between text-xs">
                                <span className="text-stone-400">Treasury</span>
                                <span className="font-bold text-amber-300">
                                  {(partyItem.treasury || 0).toLocaleString()} GP
                                </span>
                              </div>
                              <div className="px-2.5 py-1.5 rounded-lg bg-[#121318] border border-stone-800 flex items-center justify-between text-xs">
                                <span className="text-stone-400">Defenders</span>
                                <span className="font-bold text-red-300">
                                  {partyItem.defenders || 0}
                                </span>
                              </div>
                            </div>

                            {/* Special Facilities Summary Chips */}
                            <div className="mb-3">
                              <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1.5">
                                Special Facilities ({specials.length})
                              </div>
                              {specials.length === 0 ? (
                                <span className="text-xs text-stone-500 italic">None built yet</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {specials.map((sp) => (
                                    <span
                                      key={sp.uid}
                                      className={`text-[11px] px-2 py-0.5 rounded border ${
                                        sp.damaged
                                          ? 'bg-red-950/60 border-red-600/50 text-red-200'
                                          : 'bg-[#121318] border-stone-700 text-stone-200'
                                      }`}
                                    >
                                      {sp.customName}{' '}
                                      <span className="text-[#d4af37]">[{sp.assignedOrder}]</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Latest Chronicle Activity */}
                            {latestEvent && (
                              <div className="p-2.5 rounded-lg bg-[#121318]/90 border border-stone-800/80 text-[11px]">
                                <div className="font-semibold text-stone-300 truncate">
                                  Latest: {latestEvent.title}
                                </div>
                                <div className="text-stone-500 line-clamp-2 mt-0.5">
                                  {latestEvent.details}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-800/80">
                            <button
                              onClick={() => setInspectedPartyBastion(partyItem)}
                              className="w-full py-2 px-3 rounded-lg bg-[#121318] hover:bg-stone-800 text-amber-200 border border-[#d4af37]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>Inspect Full Bastion Ledger</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}