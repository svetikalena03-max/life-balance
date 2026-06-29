export type RecoveryMood = {
  id: string;
  icon: string;
  ru: string;
  en: string;
};

export type RecoveryItem = {
  id: string;
  icon: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  duration: number;
};

export const RECOVERY_MOODS: RecoveryMood[] = [
  { id: "relax", icon: "😌", ru: "Хочу расслабиться", en: "I want to relax" },
  { id: "sleep", icon: "😴", ru: "Хочу лучше уснуть", en: "I want to sleep better" },
  { id: "stress", icon: "😣", ru: "Снять стресс", en: "Relieve stress" },
  { id: "energy", icon: "💪", ru: "Восстановить силы", en: "Restore energy" },
  { id: "meditate", icon: "🧘", ru: "Помедитировать", en: "Meditate" },
  { id: "breath", icon: "🌬", ru: "Сделать дыхательную практику", en: "Do a breathing practice" },
  { id: "sounds", icon: "🎵", ru: "Послушать расслабляющие звуки", en: "Listen to relaxing sounds" },
];

export const RECOVERY_ITEMS: RecoveryItem[] = [
  {
    id: "meditation",
    icon: "🧘",
    titleRu: "Медитация",
    titleEn: "Meditation",
    descRu: "Спокойная сессия для ума и тела. Помогает успокоиться и сосредоточиться на настоящем моменте.",
    descEn: "A calm session for mind and body. Helps you settle and focus on the present moment.",
    duration: 10,
  },
  {
    id: "breathing",
    icon: "🌬",
    titleRu: "Дыхательная практика",
    titleEn: "Breathing practice",
    descRu: "Мягкое дыхание для снятия напряжения и восстановления внутреннего баланса.",
    descEn: "Gentle breathing to release tension and restore inner balance.",
    duration: 5,
  },
  {
    id: "audio",
    icon: "🎧",
    titleRu: "Аудиосессия",
    titleEn: "Audio session",
    descRu: "Расслабляющая аудио-практика, чтобы отдохнуть и почувствовать лёгкость.",
    descEn: "A relaxing audio practice to rest and feel lighter.",
    duration: 15,
  },
  {
    id: "rain",
    icon: "🌧",
    titleRu: "Звуки дождя",
    titleEn: "Sounds of rain",
    descRu: "Мягкий шум дождя для расслабления и спокойного сна.",
    descEn: "Soft rain sounds for relaxation and peaceful sleep.",
    duration: 30,
  },
  {
    id: "sea",
    icon: "🌊",
    titleRu: "Морской прибой",
    titleEn: "Sea waves",
    descRu: "Звуки морских волн помогают замедлиться и отпустить мысли.",
    descEn: "Sea wave sounds help you slow down and let thoughts go.",
    duration: 30,
  },
  {
    id: "forest",
    icon: "🌲",
    titleRu: "Лес",
    titleEn: "Forest",
    descRu: "Звуки леса для глубокого спокойствия и восстановления.",
    descEn: "Forest sounds for deep calm and recovery.",
    duration: 30,
  },
  {
    id: "fireplace",
    icon: "🔥",
    titleRu: "Камин",
    titleEn: "Fireplace",
    descRu: "Тёплое потрескивание камина создаёт уютную атмосферу для отдыха.",
    descEn: "Warm crackling fireplace creates a cozy atmosphere for rest.",
    duration: 45,
  },
];

export function findRecoveryItem(id: string): RecoveryItem | undefined {
  return RECOVERY_ITEMS.find((i) => i.id === id);
}
