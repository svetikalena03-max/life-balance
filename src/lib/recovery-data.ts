export type RecoveryMood = {
  id: string;
  icon: string;
  ru: string;
  en: string;
};

export type RecoveryStep = {
  atSeconds: number;
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
  mode: "guided" | "breathing" | "ambient";
  steps?: RecoveryStep[];
  breathing?: { inhale: number; hold: number; exhale: number };
  audio?: {
    src: string;
    sourceUrl: string;
    creditRu: string;
    creditEn: string;
  };
  safetyRu?: string;
  safetyEn?: string;
};

export const RECOVERY_MOODS: RecoveryMood[] = [
  { id: "relax", icon: "😌", ru: "Хочу расслабиться", en: "I want to relax" },
  { id: "sleep", icon: "😴", ru: "Хочу лучше уснуть", en: "I want to sleep better" },
  { id: "stress", icon: "😣", ru: "Снять стресс", en: "Relieve stress" },
  { id: "energy", icon: "💪", ru: "Восстановить силы", en: "Restore energy" },
  { id: "craving", icon: "🛟", ru: "Пережить тягу к алкоголю", en: "Ride out an alcohol urge" },
  { id: "meditate", icon: "🧘", ru: "Помедитировать", en: "Meditate" },
  { id: "breath", icon: "🌬", ru: "Сделать дыхательную практику", en: "Do a breathing practice" },
  {
    id: "sounds",
    icon: "🎵",
    ru: "Послушать расслабляющие звуки",
    en: "Listen to relaxing sounds",
  },
];

export const RECOVERY_ITEMS: RecoveryItem[] = [
  {
    id: "meditation",
    icon: "🧘",
    titleRu: "Спокойствие здесь и сейчас",
    titleEn: "Calm in the present moment",
    descRu: "Мягкая медитация с голосовыми подсказками, таймером и паузой.",
    descEn: "A gentle meditation with voice guidance, a timer and pause.",
    duration: 10,
    mode: "guided",
    steps: [
      {
        atSeconds: 0,
        ru: "Устройтесь удобно. Можно закрыть глаза. Почувствуйте опору под телом.",
        en: "Get comfortable. You may close your eyes. Feel the support beneath your body.",
      },
      {
        atSeconds: 35,
        ru: "Сделайте спокойный вдох и длинный мягкий выдох. Ничего не нужно менять или оценивать.",
        en: "Take a calm breath in and a long gentle breath out. There is nothing to change or judge.",
      },
      {
        atSeconds: 100,
        ru: "Переведите внимание на плечи, челюсть и лоб. Разрешите им немного расслабиться.",
        en: "Bring attention to your shoulders, jaw and forehead. Allow them to soften a little.",
      },
      {
        atSeconds: 190,
        ru: "Замечайте дыхание таким, какое оно есть. Если появились мысли, спокойно вернитесь к вдоху и выдоху.",
        en: "Notice the breath as it is. If thoughts arise, gently return to breathing.",
      },
      {
        atSeconds: 330,
        ru: "Почувствуйте всё тело целиком. Вы уже сделали достаточно, просто побудьте здесь.",
        en: "Feel your whole body. You have already done enough; simply stay here.",
      },
      {
        atSeconds: 510,
        ru: "Сделайте чуть более глубокий вдох. Пошевелите пальцами рук и ног.",
        en: "Take a slightly deeper breath. Move your fingers and toes.",
      },
      {
        atSeconds: 575,
        ru: "Практика заканчивается. Откройте глаза, когда будете готовы.",
        en: "The practice is ending. Open your eyes when you are ready.",
      },
    ],
  },
  {
    id: "breathing",
    icon: "🌬",
    titleRu: "Дыхание 4–2–6",
    titleEn: "4–2–6 breathing",
    descRu: "Вдох на 4 счёта, короткая пауза на 2 и плавный выдох на 6.",
    descEn: "Inhale for 4 counts, pause for 2 and exhale gently for 6.",
    duration: 5,
    mode: "breathing",
    breathing: { inhale: 4, hold: 2, exhale: 6 },
    safetyRu:
      "Не задерживайте дыхание через силу. Если закружилась голова или стало некомфортно — остановитесь и дышите как обычно.",
    safetyEn:
      "Do not force the breath hold. Stop and breathe normally if you feel dizzy or uncomfortable.",
  },
  {
    id: "craving",
    icon: "🛟",
    titleRu: "Пережить тягу — 5 минут",
    titleEn: "Ride out an urge — 5 minutes",
    descRu: "Короткая практика, чтобы не действовать на автомате и переждать пик желания выпить.",
    descEn: "A short practice to pause automatic action and ride out the peak of an urge to drink.",
    duration: 5,
    mode: "guided",
    safetyRu:
      "Эта практика не лечит зависимость. Если человек долго и много пьёт, резкая отмена алкоголя может быть опасна. При дрожи, сильной потливости, рвоте, спутанности сознания, галлюцинациях или судорогах нужна срочная медицинская помощь.",
    safetyEn:
      "This practice does not treat dependence. Suddenly stopping after prolonged heavy drinking can be dangerous. Tremors, heavy sweating, vomiting, confusion, hallucinations or seizures require urgent medical help.",
    steps: [
      {
        atSeconds: 0,
        ru: "Сейчас не нужно решать вопрос навсегда. Задача — не пить следующие пять минут.",
        en: "You do not need to solve this forever right now. The task is not to drink for the next five minutes.",
      },
      {
        atSeconds: 30,
        ru: "Уберите алкоголь из поля зрения. Если можете, перейдите в другую комнату и выпейте воды.",
        en: "Move alcohol out of sight. If possible, go to another room and drink some water.",
      },
      {
        atSeconds: 75,
        ru: "Назовите желание тягой. Это волна: она усиливается, достигает пика и затем ослабевает.",
        en: "Name the feeling as an urge. It is a wave: it rises, peaks and then weakens.",
      },
      {
        atSeconds: 130,
        ru: "Где тяга ощущается в теле? В груди, животе, горле? Просто наблюдайте, не споря с ощущением.",
        en: "Where do you feel the urge in your body? Chest, stomach, throat? Observe it without arguing with it.",
      },
      {
        atSeconds: 190,
        ru: "Сделайте спокойный вдох и длинный выдох. Вы не обязаны выполнять желание только потому, что оно появилось.",
        en: "Take a calm breath in and a long breath out. You do not have to act on an urge simply because it appeared.",
      },
      {
        atSeconds: 245,
        ru: "Выберите следующее безопасное действие: чай, душ, короткая прогулка или звонок близкому человеку.",
        en: "Choose the next safe action: tea, a shower, a short walk or calling someone you trust.",
      },
      {
        atSeconds: 285,
        ru: "Пять минут почти прошли. Отметьте, стала ли тяга хотя бы немного слабее. При необходимости повторите практику или обратитесь за поддержкой.",
        en: "Five minutes are almost over. Notice whether the urge is even slightly weaker. Repeat the practice or seek support if needed.",
      },
    ],
  },
  {
    id: "audio",
    icon: "🎧",
    titleRu: "Расслабление тела",
    titleEn: "Body relaxation",
    descRu: "Голосовая практика для снятия напряжения перед отдыхом или сном.",
    descEn: "A guided practice to release tension before rest or sleep.",
    duration: 15,
    mode: "guided",
    steps: [
      {
        atSeconds: 0,
        ru: "Лягте или сядьте удобно. Сделайте медленный выдох и позвольте телу стать тяжелее.",
        en: "Lie or sit comfortably. Exhale slowly and allow your body to feel heavier.",
      },
      {
        atSeconds: 60,
        ru: "Расслабьте стопы и голени. Не старайтесь — просто отпустите лишнее напряжение.",
        en: "Relax your feet and lower legs. Do not try too hard; simply let go of extra tension.",
      },
      {
        atSeconds: 180,
        ru: "Переведите внимание на живот и грудь. Пусть дыхание остаётся естественным.",
        en: "Bring attention to your abdomen and chest. Let the breath remain natural.",
      },
      {
        atSeconds: 360,
        ru: "Опустите плечи. Расслабьте ладони, челюсть и мышцы вокруг глаз.",
        en: "Lower your shoulders. Relax your palms, jaw and the muscles around your eyes.",
      },
      {
        atSeconds: 600,
        ru: "Если приходят мысли, позвольте им пройти, как облакам. Возвращайтесь к ощущению покоя в теле.",
        en: "If thoughts arise, let them pass like clouds. Return to the feeling of ease in your body.",
      },
      {
        atSeconds: 840,
        ru: "Практика подходит к концу. Можно остаться отдыхать или мягко открыть глаза.",
        en: "The practice is ending. You may remain at rest or gently open your eyes.",
      },
    ],
  },
  {
    id: "rain",
    icon: "🌧",
    titleRu: "Звуки дождя",
    titleEn: "Sounds of rain",
    descRu: "Мягкий шум дождя для расслабления и спокойного сна.",
    descEn: "Soft rain sounds for relaxation and peaceful sleep.",
    duration: 30,
    mode: "ambient",
    audio: {
      src: "/audio/rain.mp3",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Rain_(1).ogg",
      creditRu: "Запись: ezwa · общественное достояние",
      creditEn: "Recording: ezwa · public domain",
    },
  },
  {
    id: "sea",
    icon: "🌊",
    titleRu: "Морской прибой",
    titleEn: "Sea waves",
    descRu: "Звуки морских волн помогают замедлиться и отпустить мысли.",
    descEn: "Sea wave sounds help you slow down and let thoughts go.",
    duration: 30,
    mode: "ambient",
    audio: {
      src: "/audio/sea.mp3",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Waves.ogg",
      creditRu: "Запись: Dsw4 · общественное достояние",
      creditEn: "Recording: Dsw4 · public domain",
    },
  },
  {
    id: "forest",
    icon: "🌲",
    titleRu: "Лес",
    titleEn: "Forest",
    descRu: "Звуки леса для глубокого спокойствия и восстановления.",
    descEn: "Forest sounds for deep calm and recovery.",
    duration: 30,
    mode: "ambient",
    audio: {
      src: "/audio/forest.mp3",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:20090610_0_ambience.ogg",
      creditRu: "Запись: nille · общественное достояние",
      creditEn: "Recording: nille · public domain",
    },
  },
  {
    id: "fireplace",
    icon: "🔥",
    titleRu: "Камин",
    titleEn: "Fireplace",
    descRu: "Тёплое потрескивание камина создаёт уютную атмосферу для отдыха.",
    descEn: "Warm crackling fireplace creates a cozy atmosphere for rest.",
    duration: 45,
    mode: "ambient",
    audio: {
      src: "/audio/fireplace.mp3",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Dry_grass_burning_in_open_fireplace.ogg",
      creditRu: "Запись: ezwa · общественное достояние",
      creditEn: "Recording: ezwa · public domain",
    },
  },
];

export function findRecoveryItem(id: string): RecoveryItem | undefined {
  return RECOVERY_ITEMS.find((item) => item.id === id);
}

export function getRecoveryStep(
  item: RecoveryItem,
  elapsedSeconds: number,
): RecoveryStep | undefined {
  return item.steps?.reduce<RecoveryStep | undefined>(
    (current, step) => (step.atSeconds <= elapsedSeconds ? step : current),
    undefined,
  );
}
