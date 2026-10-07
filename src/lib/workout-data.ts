export type WorkoutVisual = "arms" | "march" | "squat" | "wallPushup" | "sideStretch";

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
    description: "Пять спокойных движений с точными видеоподсказками.",
    level: "Мягкая",
    accent: "from-amber-400/20 via-orange-300/10 to-rose-300/10",
    exercises: [
      {
        id: "shoulder-stretch-right",
        title: "Растяжка правого плеча",
        seconds: 45,
        instruction:
          "Вытяните правую руку перед собой, прижмите её левой рукой к груди и удерживайте.",
        tip: "Плечо опустите, не тяните через боль.",
        visual: "arms",
      },
      {
        id: "shoulder-stretch-left",
        title: "Растяжка левого плеча",
        seconds: 45,
        instruction:
          "Вытяните левую руку перед собой, прижмите её правой рукой к груди и удерживайте.",
        tip: "Дышите спокойно, шею не напрягайте.",
        visual: "arms",
      },
      {
        id: "easy-march",
        title: "Шаги на месте",
        seconds: 120,
        instruction: "Шагайте на месте, поочерёдно поднимая колени до комфортной высоты.",
        tip: "Держитесь за устойчивую опору, если нужна поддержка.",
        visual: "march",
      },
      {
        id: "half-squat",
        title: "Неглубокие приседания",
        seconds: 90,
        instruction: "Отведите таз назад, слегка согните колени и плавно выпрямитесь.",
        tip: "Колени направлены вперёд. Не приседайте глубже, чем комфортно.",
        visual: "squat",
      },
      {
        id: "side-stretch",
        title: "Наклоны в стороны",
        seconds: 90,
        instruction:
          "Соедините руки над головой и плавно наклоняйтесь вправо и влево, как на видео.",
        tip: "Не заваливайтесь вперёд и не делайте резких движений.",
        visual: "sideStretch",
      },
    ],
  },
  {
    id: "active-no-jumps",
    icon: "⚡",
    title: "Бодрая без прыжков",
    description: "Более заметная нагрузка: шаги, приседания и отжимания от стены.",
    level: "Средняя",
    accent: "from-emerald-400/20 via-teal-300/10 to-sky-300/10",
    exercises: [
      {
        id: "active-warmup",
        title: "Разминка шагами",
        seconds: 90,
        instruction: "Шагайте на месте в спокойном темпе, постепенно поднимая колени выше.",
        tip: "Корпус держите ровно, дышите свободно.",
        visual: "march",
      },
      {
        id: "active-squat-one",
        title: "Приседания — первый подход",
        seconds: 120,
        instruction: "Отведите таз назад, согните колени и вернитесь в исходное положение.",
        tip: "Выполняйте в своём темпе. При боли уменьшите глубину.",
        visual: "squat",
      },
      {
        id: "wall-push-one",
        title: "Отжимания от стены — первый подход",
        seconds: 90,
        instruction:
          "Упритесь ладонями в стену, согните локти и приблизьте корпус, затем оттолкнитесь.",
        tip: "Сохраняйте прямую линию от макушки до пяток.",
        visual: "wallPushup",
      },
      {
        id: "fast-march",
        title: "Энергичные шаги",
        seconds: 120,
        instruction: "Шагайте на месте в бодром темпе, поднимая колени как на видео.",
        tip: "Снизьте темп, если появилась выраженная одышка.",
        visual: "march",
      },
      {
        id: "active-squat-two",
        title: "Приседания — второй подход",
        seconds: 120,
        instruction: "Снова выполняйте приседания: таз назад, колени сгибаются, спина ровная.",
        tip: "Можно сделать паузу или пропустить подход.",
        visual: "squat",
      },
      {
        id: "wall-push-two",
        title: "Отжимания от стены — второй подход",
        seconds: 90,
        instruction: "Повторите отжимания от стены, двигаясь всем корпусом и сгибая локти.",
        tip: "Чем дальше стопы от стены, тем выше нагрузка.",
        visual: "wallPushup",
      },
      {
        id: "active-cooldown",
        title: "Спокойные наклоны в стороны",
        seconds: 90,
        instruction: "Соедините руки над головой и мягко наклоняйтесь из стороны в сторону.",
        tip: "Замедлите дыхание и двигайтесь без рывков.",
        visual: "sideStretch",
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
