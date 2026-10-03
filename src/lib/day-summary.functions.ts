import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const analyzeDaySummaryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
});

export const daySummaryAnalysisSchema = z
  .object({
    summary: z.string().trim().min(1).max(900),
    positives: z.array(z.string().trim().min(1).max(350)).min(1).max(4),
    attention: z.array(z.string().trim().min(1).max(350)).min(1).max(4),
    tomorrow: z.array(z.string().trim().min(1).max(350)).min(1).max(4),
    score: z
      .object({
        value: z.number().int().min(0).max(100),
        label: z.string().trim().min(1).max(80),
        explanation: z.string().trim().min(1).max(500),
      })
      .strict(),
  })
  .strict();

export type DaySummaryAnalysis = z.infer<typeof daySummaryAnalysisSchema>;

export type AnalyzeDaySummaryResult =
  { ok: true; analysis: DaySummaryAnalysis } | { ok: false; error: string };

const YANDEXGPT_NOT_CONFIGURED_ERROR =
  "YandexGPT API не настроен. Добавьте серверные переменные Yandex Cloud.";

function withoutEmptyValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withoutEmptyValues).filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== null && item !== undefined && item !== "")
        .map(([key, item]) => [key, withoutEmptyValues(item)]),
    );
  }
  return value === null || value === undefined || value === "" ? undefined : value;
}

function mealForAnalysis(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const meal = value as Record<string, unknown>;
  return withoutEmptyValues({
    food: meal.food,
    portion: meal.portion,
    time: meal.time,
    comment: meal.comment,
  });
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function nonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function buildAnalysisContext({
  date,
  profile,
  daily,
  health,
  habits,
  healthFeatures,
}: {
  date: string;
  profile: Record<string, unknown> | null;
  daily: Record<string, unknown> | null;
  health: Record<string, unknown> | null;
  habits: Record<string, unknown> | null;
  healthFeatures: Record<string, unknown> | null;
}) {
  const profileData = profile
    ? {
        ageYears: positiveNumber(profile.age),
        gender: profile.gender,
        heightCm: positiveNumber(profile.height),
        currentWeightKg: positiveNumber(profile.current_weight),
        targetWeightKg: positiveNumber(profile.target_weight),
        waterGoalMl: positiveNumber(profile.water_goal),
        goal: profile.goal,
      }
    : undefined;

  const dailyData = daily
    ? {
        meals: {
          firstBreakfast: mealForAnalysis(daily.breakfast_1),
          secondBreakfast: mealForAnalysis(daily.breakfast_2),
          snack: mealForAnalysis(daily.snack),
          lunch: mealForAnalysis(daily.lunch),
          afternoonSnack: mealForAnalysis(daily.afternoon_snack),
          dinner: mealForAnalysis(daily.dinner),
          lateSnack: mealForAnalysis(daily.late_snack),
          extra: Array.isArray(daily.extra_meals)
            ? daily.extra_meals.map(mealForAnalysis)
            : daily.extra_meals,
        },
        waterMl: nonNegativeNumber(daily.water_ml),
        teaMl: nonNegativeNumber(daily.tea_ml),
        coffeeMl: nonNegativeNumber(daily.coffee_ml),
        sodaMl: nonNegativeNumber(daily.soda_ml),
        juiceMl: nonNegativeNumber(daily.juice_ml),
        otherDrinks: daily.other_drinks,
        sugar: daily.sugar,
        sugarOther: daily.sugar_other,
        milkOrCream: daily.milk_or_cream,
        breadCrispsCount: nonNegativeNumber(daily.bread_crisps_count),
        sleepHours: nonNegativeNumber(daily.sleep_hours),
        mood: positiveNumber(daily.mood),
        steps: nonNegativeNumber(daily.steps),
        workout: daily.workout,
        workoutMinutes: nonNegativeNumber(daily.workout_minutes),
        weightKg: positiveNumber(daily.weight),
        wellbeing: daily.wellbeing,
      }
    : undefined;

  const healthData = health
    ? {
        systolicPressure: positiveNumber(health.systolic_pressure),
        diastolicPressure: positiveNumber(health.diastolic_pressure),
        pulseBpm: positiveNumber(health.pulse),
        energy: positiveNumber(health.energy),
        swelling: health.swelling,
        heartburn: health.heartburn,
        bloating: health.bloating,
        backPain: health.back_pain,
        kneePain: health.knee_pain,
        stress: health.stress,
        comment: health.health_comment,
      }
    : undefined;

  const habitsData = habits
    ? {
        smoking: habits.smoking,
        vape: habits.vape,
        alcohol: habits.alcohol,
        coffeePerDay: habits.coffee_per_day,
        coffeeMl: nonNegativeNumber(habits.coffee_ml),
        teaCups: nonNegativeNumber(habits.tea_cups),
        teaMl: nonNegativeNumber(habits.tea_ml),
        teaSugar: habits.tea_sugar,
        energyDrinks: habits.energy_drinks,
        sweets: habits.sweets,
        fastFood: habits.fast_food,
        nightSnacks: habits.night_snacks,
        stressLevel: habits.stress_level,
        screenTime: habits.screen_time,
        usualSteps: nonNegativeNumber(habits.usual_steps),
      }
    : undefined;

  const healthFeaturesData = healthFeatures
    ? {
        chronicConditions: healthFeatures.chronic_conditions,
        chronicOther: healthFeatures.chronic_other,
        movementLimitations: healthFeatures.movement_limitations,
        giIssues: healthFeatures.gi_issues,
        foodIntolerances: healthFeatures.food_intolerances,
        womenHealth: healthFeatures.women_health,
        takesMeds: healthFeatures.takes_meds,
        medications: healthFeatures.medications,
        hasDoctorRecommendations: healthFeatures.has_doctor_rec,
        doctorRecommendations: healthFeatures.doctor_recommendations,
        workoutLimits: healthFeatures.workout_limits,
        comment: healthFeatures.comment,
      }
    : undefined;

  return withoutEmptyValues({
    date,
    profile: profileData,
    daily: dailyData,
    health: healthData,
    habits: habitsData,
    healthFeatures: healthFeaturesData,
  });
}

function buildSystemPrompt(): string {
  return [
    "Ты — осторожный помощник по наблюдению за образом жизни в приложении «Баланс жизни».",
    "Анализируй только факты из JSON за выбранную дату и личный контекст; не придумывай отсутствующие значения.",
    "Сначала сопоставь связанные показатели, затем сформулируй выводы и действия на русском языке.",
    "Воду сравнивай с profile.waterGoalMl, только если цель передана; без цели не называй объём достаточным или недостаточным.",
    "Шаги являются физической активностью: анализируй daily.steps вместе с тренировкой, сравнивай с habits.usualSteps, если они переданы, и не считай отсутствие тренировки отсутствием активности.",
    "Сон оценивай относительно разумного ориентировочного диапазона с учётом доступного возраста и личного контекста, без медицинских выводов; при недостатке контекста укажи ограничение вывода.",
    "Питание оценивай по указанному составу, порциям и распределению по времени; учитывай comment у конкретного приёма пищи, но не рассчитывай калории или БЖУ без точных исходных данных.",
    "Самочувствие, health.comment и отмеченные симптомы сопоставляй с событиями дня осторожно: используй формулировки «может совпадать» и «стоит понаблюдать», не утверждай причинную связь.",
    "При рекомендациях по активности обязательно учитывай healthFeatures.movementLimitations, healthFeatures.workoutLimits и рекомендации врача, если они переданы.",
    "Привычки используй только как фон для текущего дня; не повторяй совет о привычке, если данные этого дня не дают для него конкретного основания.",
    "Не хвали показатель за сам факт заполнения и не называй его хорошим, достаточным или недостаточным без явного основания сравнения.",
    "Если данных не хватает, прямо назови отсутствующий показатель, который нужен для уверенного вывода.",
    "Оценка 0–100 отражает баланс и качество именно записанного дня: питание, воду относительно цели, сон, движение и шаги, самочувствие и тревожные факторы; это не оценка здоровья и не оценка полноты анкеты.",
    "Не штрафуй автоматически за отсутствие тренировки при достаточной повседневной активности.",
    "В tomorrow дай 1–4 конкретных выполнимых действия, напрямую вытекающих из данных этого дня; используй известные количества или контекст вместо общих советов, когда это возможно.",
    "Не ставь диагнозы, не трактуй симптомы как заболевание, не назначай лечение, не советуй менять лекарства и не делай категоричных медицинских причинно-следственных выводов.",
    "При тревожных показателях рекомендуй обратиться к врачу без медицинских утверждений.",
  ].join(" ");
}

export const analyzeDaySummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(analyzeDaySummaryInputSchema)
  .handler(async ({ data, context }): Promise<AnalyzeDaySummaryResult> => {
    const { supabase, userId } = context;

    const [profileResult, dailyResult, healthResult, habitsResult, featuresResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("age,gender,height,current_weight,target_weight,water_goal,goal")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("daily_entries")
          .select(
            "breakfast_1,breakfast_2,snack,lunch,afternoon_snack,dinner,late_snack,extra_meals,water_ml,tea_ml,coffee_ml,soda_ml,juice_ml,other_drinks,sugar,sugar_other,milk_or_cream,bread_crisps_count,sleep_hours,mood,steps,workout,workout_minutes,weight,wellbeing",
          )
          .eq("user_id", userId)
          .eq("date", data.date)
          .maybeSingle(),
        supabase
          .from("health_entries")
          .select(
            "systolic_pressure,diastolic_pressure,pulse,energy,swelling,heartburn,bloating,back_pain,knee_pain,stress,health_comment",
          )
          .eq("user_id", userId)
          .eq("date", data.date)
          .maybeSingle(),
        supabase
          .from("habits")
          .select(
            "smoking,vape,alcohol,coffee_per_day,coffee_ml,tea_cups,tea_ml,tea_sugar,energy_drinks,sweets,fast_food,night_snacks,stress_level,screen_time,usual_steps",
          )
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("health_features")
          .select(
            "chronic_conditions,chronic_other,movement_limitations,gi_issues,food_intolerances,women_health,takes_meds,medications,has_doctor_rec,doctor_recommendations,workout_limits,comment",
          )
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    const databaseError = [
      profileResult.error,
      dailyResult.error,
      healthResult.error,
      habitsResult.error,
      featuresResult.error,
    ].find(Boolean);

    if (databaseError) {
      console.error("[AI] analyzeDaySummary database read failed:", databaseError);
      return { ok: false, error: "Не удалось загрузить данные дня для анализа" };
    }

    if (!dailyResult.data && !healthResult.data) {
      return { ok: false, error: "Для выбранной даты нет сохранённых данных" };
    }

    const { isYandexGPTConfigured, generateYandexGPTCompletion } =
      await import("@/integrations/yandexgpt/client.server");

    if (!isYandexGPTConfigured()) {
      return { ok: false, error: YANDEXGPT_NOT_CONFIGURED_ERROR };
    }

    const analysisContext = buildAnalysisContext({
      date: data.date,
      profile: profileResult.data,
      daily: dailyResult.data,
      health: healthResult.data,
      habits: habitsResult.data,
      healthFeatures: featuresResult.data,
    });

    try {
      const content = await generateYandexGPTCompletion({
        temperature: 0.3,
        messages: [
          { role: "system", text: buildSystemPrompt() },
          {
            role: "user",
            text: [
              `Сформируй анализ сохранённого дня ${data.date}.`,
              "Верни только JSON-объект, соответствующий заданной структуре: summary, positives, attention, tomorrow и score с полями value, label, explanation.",
              `Данные пользователя (JSON): ${JSON.stringify(analysisContext)}`,
            ].join("\n\n"),
          },
        ],
      });

      let raw: unknown;
      try {
        raw = JSON.parse(content);
      } catch {
        return { ok: false, error: "YandexGPT вернул невалидный JSON" };
      }

      const validated = daySummaryAnalysisSchema.safeParse(raw);
      if (!validated.success) {
        console.error("[AI] analyzeDaySummary response validation failed:", validated.error);
        return { ok: false, error: "YandexGPT вернул ответ в неожиданном формате" };
      }

      return { ok: true, analysis: validated.data };
    } catch (error) {
      console.error("[AI] analyzeDaySummary failed:", error);
      return { ok: false, error: "Не удалось сформировать AI-анализ. Попробуйте ещё раз." };
    }
  });
