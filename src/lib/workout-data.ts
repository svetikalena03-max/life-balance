export type WorkoutVisual =
  "warmup" | "march" | "squat" | "push" | "step" | "chair" | "stretch" | "breath";

export type WorkoutExercise = {
  id: string;
  title: string;
  seconds: number;
  instruction: string;
  tip: string;
  visual: WorkoutVisual;
};

export type WorkoutProgram = {
  id: string;
  icon: string;
  title: string;
  description: string;
  level: "Мягкая" | "Средняя";
  accent: string;
  exercises: WorkoutExercise[];
};

export const WORKOUTS: WorkoutProgram[] = [
  {
    id: "gentle-morning",
    icon: "🌤️",
    title: "Мягкое утро",
    description: "Спокойно разбудить тело без прыжков и резких движений.",
    level: "Мягкая",
    accent: "from-amber-400/20 via-orange-300/10 to-rose-300/10",
    exercises: [
      {
        id: "warm-breath",
        title: "Разогрев и дыхание",
        seconds: 60,
        instruction: "Стойте устойчиво или сядьте. Расправьте плечи и спокойно подышите.",
        tip: "Не запрокидывайте голову и не задерживайте дыхание.",
        visual: "breath",
      },
      {
        id: "shoulders",
        title: "Круги плечами",
        seconds: 60,
        instruction: "Поднимайте плечи вверх, мягко отводите назад и опускайте.",
        tip: "Движение медленное, шея остаётся свободной.",
        visual: "warmup",
      },
      {
        id: "easy-march",
        title: "Шаги на месте",
        seconds: 90,
        instruction: "Поочерёдно поднимайте стопы и легко двигайте руками.",
        tip: "Держитесь за спинку стула, если нужна опора.",
        visual: "march",
      },
      {
        id: "chair-rise",
        title: "Встать и сесть",
        seconds: 90,
        instruction: "Медленно встаньте со стула и так же плавно сядьте обратно.",
        tip: "Колени направлены вперёд. Можно помогать себе руками.",
        visual: "chair",
      },
      {
        id: "side-step-easy",
        title: "Шаги в стороны",
        seconds: 90,
        instruction: "Сделайте шаг вправо, приставьте ногу, затем повторите влево.",
        tip: "Шаг небольшой, стопы смотрят вперёд.",
        visual: "step",
      },
      {
        id: "gentle-stretch",
        title: "Мягкая растяжка",
        seconds: 90,
        instruction: "Потянитесь макушкой вверх и мягко вытяните руки по очереди.",
        tip: "Тянитесь до приятного ощущения, не через боль.",
        visual: "stretch",
      },
    ],
  },
  {
    id: "active-no-jumps",
    icon: "⚡",
    title: "Бодрая без прыжков",
    description: "Более заметная нагрузка на всё тело, но без бега и прыжков.",
    level: "Средняя",
    accent: "from-emerald-400/20 via-teal-300/10 to-sky-300/10",
    exercises: [
      {
        id: "active-warmup",
        title: "Разминка",
        seconds: 60,
        instruction: "Шагайте легко, постепенно подключая движения руками.",
        tip: "Начинайте медленно и ускоряйтесь только при хорошем самочувствии.",
        visual: "warmup",
      },
      {
        id: "fast-march",
        title: "Энергичные шаги",
        seconds: 120,
        instruction: "Шагайте на месте в бодром темпе, помогая себе руками.",
        tip: "Корпус прямой, дышите свободно.",
        visual: "march",
      },
      {
        id: "half-squat",
        title: "Неглубокие приседания",
        seconds: 90,
        instruction: "Отведите таз назад, слегка согните колени и вернитесь вверх.",
        tip: "Не приседайте глубоко. При боли замените упражнение шагами.",
        visual: "squat",
      },
      {
        id: "wall-push",
        title: "Отжимания от стены",
        seconds: 90,
        instruction: "Ладони на стене. Согните локти и плавно оттолкнитесь.",
        tip: "Тело держите прямой линией, плечи не поднимайте.",
        visual: "push",
      },
      {
        id: "knee-lift",
        title: "Подъём коленей",
        seconds: 90,
        instruction: "Поднимайте колени по очереди до комфортной высоты.",
        tip: "Можно держаться за устойчивую опору.",
        visual: "march",
      },
      {
        id: "wide-step",
        title: "Шаги в стороны с руками",
        seconds: 120,
        instruction: "Шагайте вправо и влево, одновременно раскрывая руки.",
        tip: "Не заваливайте колени внутрь.",
        visual: "step",
      },
      {
        id: "back-step",
        title: "Шаг назад",
        seconds: 90,
        instruction: "Поочерёдно отставляйте ногу назад, сохраняя вес на передней ноге.",
        tip: "Шаг короткий. При неустойчивости держитесь за стул.",
        visual: "step",
      },
      {
        id: "active-cooldown",
        title: "Восстановление дыхания",
        seconds: 60,
        instruction: "Замедлите шаг и сделайте несколько спокойных выдохов.",
        tip: "Не останавливайтесь резко после активной части.",
        visual: "breath",
      },
    ],
  },
  {
    id: "chair-workout",
    icon: "🪑",
    title: "Тренировка сидя",
    description: "Для дней, когда трудно долго стоять или хочется снизить нагрузку на ноги.",
    level: "Мягкая",
    accent: "from-sky-400/20 via-blue-300/10 to-violet-300/10",
    exercises: [
      {
        id: "chair-posture",
        title: "Настройка положения",
        seconds: 60,
        instruction: "Сядьте ближе к краю устойчивого стула, стопы полностью на полу.",
        tip: "Не используйте стул на колёсах.",
        visual: "chair",
      },
      {
        id: "seated-march",
        title: "Марш сидя",
        seconds: 120,
        instruction: "Поднимайте колени по очереди в комфортной амплитуде.",
        tip: "Спина вытянута, руками можно держаться за сиденье.",
        visual: "chair",
      },
      {
        id: "knee-extension",
        title: "Разгибание ног",
        seconds: 90,
        instruction: "Поочерёдно выпрямляйте ногу и возвращайте стопу на пол.",
        tip: "Не выпрямляйте колено через боль.",
        visual: "chair",
      },
      {
        id: "seated-punch",
        title: "Руки вперёд",
        seconds: 90,
        instruction: "Мягко вытягивайте руки вперёд по очереди, без рывков.",
        tip: "Плечи опущены, локти полностью не блокируйте.",
        visual: "push",
      },
      {
        id: "heel-toe",
        title: "Пятка и носок",
        seconds: 90,
        instruction: "Поочерёдно поднимайте пятки, затем носки, не отрывая стопы целиком.",
        tip: "Двигайтесь в удобном ритме.",
        visual: "chair",
      },
      {
        id: "seated-stretch",
        title: "Потягивания сидя",
        seconds: 90,
        instruction: "Тянитесь руками вверх по очереди, сохраняя устойчивое положение.",
        tip: "Если кружится голова, держите руки ниже.",
        visual: "stretch",
      },
      {
        id: "chair-breath",
        title: "Спокойное завершение",
        seconds: 60,
        instruction: "Опустите руки, расслабьте плечи и восстановите дыхание.",
        tip: "Вставайте со стула не спеша.",
        visual: "breath",
      },
    ],
  },
  {
    id: "mobility-stretch",
    icon: "🌿",
    title: "Подвижность и растяжка",
    description: "Неспешные движения после рабочего дня или долгого сидения.",
    level: "Мягкая",
    accent: "from-teal-400/20 via-emerald-300/10 to-lime-300/10",
    exercises: [
      {
        id: "neck-release",
        title: "Расслабление шеи",
        seconds: 60,
        instruction: "Мягко поворачивайте голову вправо и влево в небольшой амплитуде.",
        tip: "Не делайте полные круги головой.",
        visual: "warmup",
      },
      {
        id: "shoulder-release",
        title: "Плечи и лопатки",
        seconds: 60,
        instruction: "Сведите лопатки, задержитесь на секунду и расслабьтесь.",
        tip: "Не прогибайтесь в пояснице.",
        visual: "warmup",
      },
      {
        id: "side-reach",
        title: "Потягивание в сторону",
        seconds: 90,
        instruction: "Поднимите руку и слегка потянитесь в противоположную сторону.",
        tip: "Не уходите в глубокий наклон.",
        visual: "stretch",
      },
      {
        id: "hip-mobility",
        title: "Подвижность таза",
        seconds: 90,
        instruction: "Переносите вес с ноги на ногу небольшими плавными движениями.",
        tip: "Стопы стоят устойчиво, колени мягкие.",
        visual: "step",
      },
      {
        id: "calf-stretch",
        title: "Икры у опоры",
        seconds: 90,
        instruction: "Отставьте одну ногу назад и мягко прижмите пятку к полу.",
        tip: "Обе стопы смотрят вперёд. Затем поменяйте сторону.",
        visual: "stretch",
      },
      {
        id: "chair-hamstring",
        title: "Задняя поверхность бедра",
        seconds: 60,
        instruction: "Сидя, выпрямите одну ногу и слегка потянитесь грудью вперёд.",
        tip: "Спина длинная, глубокий наклон не нужен.",
        visual: "chair",
      },
      {
        id: "stretch-finish",
        title: "Завершение",
        seconds: 30,
        instruction: "Вернитесь в удобное положение и спокойно подышите.",
        tip: "Отметьте, где в теле стало свободнее.",
        visual: "breath",
      },
    ],
  },
];

export function getWorkout(id: string): WorkoutProgram | undefined {
  return WORKOUTS.find((workout) => workout.id === id);
}

export function getWorkoutMinutes(workout: WorkoutProgram): number {
  return Math.round(workout.exercises.reduce((sum, exercise) => sum + exercise.seconds, 0) / 60);
}
