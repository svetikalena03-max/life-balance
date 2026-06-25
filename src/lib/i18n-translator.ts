// Runtime DOM translator: when lang=en, walk all text nodes / placeholders /
// titles / aria-labels / alt attributes and swap Russian originals for English.
// Keeps the original Russian on the node so toggling back to RU restores text.

const MAP: Record<string, string> = {
  // App + brand
  "Баланс жизни": "Balance of Life",
  "Баланс жизни — здоровье, питание, сон": "Balance of Life — health, nutrition, sleep",
  "Питание, здоровье, сон, энергия и хорошее самочувствие каждый день.":
    "Nutrition, health, sleep, energy and well-being every day.",
  "Ваш персональный помощник по здоровью, питанию, активности и хорошему самочувствию.":
    "Your personal assistant for health, nutrition, activity and well-being.",
  "Персональный помощник по здоровью, питанию, активности и хорошему самочувствию.":
    "Personal assistant for health, nutrition, activity and well-being.",
  "Войдите в приложение Баланс жизни.": "Sign in to Balance of Life.",
  "Создайте аккаунт в приложении Баланс жизни.": "Create your Balance of Life account.",
  "Создайте аккаунт «Баланс жизни»": "Create your Balance of Life account",
  "Сброс пароля для входа в Баланс жизни.": "Reset password for Balance of Life.",
  "Вход — Баланс жизни": "Sign in — Balance of Life",
  "Регистрация — Баланс жизни": "Sign up — Balance of Life",
  "Восстановление пароля — Баланс жизни": "Password recovery — Balance of Life",
  "Новый пароль — Баланс жизни": "New password — Balance of Life",

  // Nav / common
  "Главная": "Home", "Дневник": "Diary", "Здоровье": "Health",
  "История": "History", "Графики": "Charts", "Профиль": "Profile",
  "Настройки": "Settings", "Мои привычки": "My habits",
  "Особенности здоровья": "Health features", "Подписка": "Subscription",
  "Голосовой помощник": "Voice assistant", "Голосовой дневник": "Voice diary",
  "Админ-панель": "Admin panel", "AI-рекомендации": "AI recommendations",
  "AI-анализ здоровья": "AI health analysis",

  // Buttons / actions
  "Сохранить": "Save", "Назад": "Back", "На главную": "Home",
  "Войти": "Sign in", "Выйти": "Sign out", "Зарегистрироваться": "Sign up",
  "Создать аккаунт": "Create account", "Входим...": "Signing in...",
  "Создаём...": "Creating...", "Вход": "Sign in", "Регистрация": "Sign up",
  "Сброс пароля": "Password reset", "Новый пароль": "New password",
  "Восстановить пароль": "Reset password",
  "Показать пароль": "Show password", "Скрыть пароль": "Hide password",
  "Сменить язык": "Change language",
  "Светлая": "Light", "Тёмная": "Dark",
  "Светлая тема": "Light theme", "Тёмная тема": "Dark theme",
  "Язык": "Language", "Тема": "Theme",
  "Готово": "Done", "Документ": "Document",
  "Добавить ещё приём пищи": "Add another meal",
  "Сбросить тестовый аккаунт": "Reset test account",
  "Удалить все данные дневника?": "Delete all diary data?",
  "Подтвердите все обязательные согласия": "Please confirm all required agreements",

  // Dashboard / metrics
  "Текущий вес": "Current weight", "Целевой вес": "Target weight",
  "Целевой вес, кг": "Target weight, kg", "Вес": "Weight", "Вес, кг": "Weight, kg",
  "Рост, см": "Height, cm", "Дата рождения": "Date of birth", "Имя": "Name",
  "Пол": "Gender", "Цель": "Goal",
  "Похудение": "Weight loss", "Набор веса": "Weight gain",
  "Поддержание веса": "Maintain weight", "Улучшение здоровья": "Improve health",
  "Улучшение сна": "Improve sleep", "Контроль давления": "Blood pressure control",
  "Мужской": "Male", "Женский": "Female", "Другой": "Other",
  "Не указано": "Not set", "Не заполнено": "Not filled",
  "Вода": "Water", "Вода, мл": "Water, ml", "Вода, л": "Water, l",
  "Сон": "Sleep", "Сон, часов": "Sleep, hours", "Часы сна": "Sleep hours",
  "Настроение": "Mood", "Самочувствие": "Well-being",
  "Энергия": "Energy", "Энергия, 1–10": "Energy, 1–10",
  "Уровень энергии": "Energy level", "Уровень стресса": "Stress level",
  "Давление": "Blood pressure", "Давление, мм рт.ст.": "Blood pressure, mmHg",
  "Верхнее": "Systolic", "Нижнее": "Diastolic",
  "Верхнее давление": "Systolic pressure", "Нижнее давление": "Diastolic pressure",
  "Пониженное давление": "Low blood pressure",
  "Пульс": "Pulse", "Пульс, уд/мин": "Pulse, bpm",
  "Шаги": "Steps", "Шагов в обычный день": "Steps on a typical day",
  "Тренировка": "Workout", "Тренировка, мин": "Workout, min",
  "Какая тренировка": "Workout type", "Йога, бег, силовая…": "Yoga, running, strength…",
  "Хлебцы": "Crispbreads", "Хлебцы, шт": "Crispbreads, pcs",
  "Хлебцы за день, шт": "Crispbreads per day, pcs",
  "Чай": "Tea", "Чай, мл": "Tea, ml",
  "Кофе": "Coffee", "Кофе, мл": "Coffee, ml",
  "Сахар": "Sugar", "С сахаром": "With sugar", "Без сахара": "No sugar",
  "Уточните количество сахара": "Specify sugar amount",
  "например, 3 ложки": "e.g. 3 spoons",
  "Молоко / сливки": "Milk / cream", "Молоко/сливки": "Milk / cream",
  "Газировка, мл": "Soda, ml", "Сок, мл": "Juice, ml",
  "Другие напитки": "Other drinks", "Объём, мл": "Volume, ml",
  "кефир, морс…": "kefir, fruit drink…",
  "Сладкие напитки (сок + газировка), мл": "Sugary drinks (juice + soda), ml",
  "Напитки": "Drinks", "Напитки (старый формат)": "Drinks (legacy)",
  "Питание (старый формат)": "Food (legacy)",
  "Питание сегодня": "Food today", "Приёмов": "Meals", "Приёмы пищи": "Meals",
  "Завтрак 1": "Breakfast 1", "Завтрак 2": "Breakfast 2",
  "Обед": "Lunch", "Полдник": "Afternoon snack", "Ужин": "Dinner",
  "Перекус": "Snack", "Поздний перекус": "Late snack",
  "Ночные перекусы": "Night snacks", "Дополнительный приём": "Extra meal",
  "Время": "Time", "Что ел": "What you ate", "Каша, омлет, фрукты…": "Porridge, omelet, fruit…",
  "Количество / порция": "Amount / portion", "200 г / 1 тарелка": "200 g / 1 plate",
  "Комментарий": "Comment", "Ощущения, ингредиенты…": "Feelings, ingredients…",

  // Sleep / mood / wellbeing
  "Норма: 7–9 ч": "Norm: 7–9 h", "Краткая отметка": "Quick note",
  "Отличное": "Excellent", "Хорошее": "Good", "Так себе": "So-so",
  "Старайтесь спать не менее 7 часов.": "Try to sleep at least 7 hours.",
  "Следите за давлением и пульсом.": "Track blood pressure and pulse.",
  "Сохраняйте записи в дневнике каждый день.": "Keep daily diary entries.",
  "Как себя чувствуете?": "How do you feel?",
  "Что беспокоит, что хорошо…": "What bothers you, what's good…",
  "Комментарий к здоровью": "Health comment",
  "Комментарий к самочувствию": "Well-being comment",
  "Запишите, как прошёл день": "Write how your day went",
  "Дневник дня": "Daily diary", "Дневник питания": "Food diary",
  "Подробности дня": "Day details", "Показатели дня": "Day metrics",
  "Динамика по дням": "Daily dynamics", "Симптомы": "Symptoms",
  "Давление, пульс и самочувствие": "Blood pressure, pulse, well-being",
  "Давление и пульс": "Blood pressure & pulse",
  "Настроение и энергия": "Mood & energy",
  "Контроль веса": "Weight control", "Контроль воды": "Water control",
  "Контроль сна": "Sleep control", "Контроль привычек": "Habit control",
  "Меню на следующий день": "Next-day menu",
  "Персональные рекомендации": "Personal recommendations",
  "Что умеет приложение": "What the app does",
  "Для кого": "Who it's for", "Почему это полезно": "Why it helps",
  "Приложение помогает видеть взаимосвязь между:": "The app shows the connection between:",
  "Для мужчин и женщин любого возраста": "For men and women of any age",
  "Для желающих похудеть": "For those who want to lose weight",
  "Для людей с хроническими заболеваниями": "For people with chronic conditions",
  "Для контроля давления": "For blood pressure control",
  "Для улучшения сна": "For better sleep",
  "Для формирования полезных привычек": "For building healthy habits",

  // Greetings
  "Привет": "Hi", "Друг": "friend", "друг": "friend",
  "Добро пожаловать обратно": "Welcome back",
  "Запись сохранена": "Entry saved", "День сохранён": "Day saved",
  "Привычки сохранены": "Habits saved",
  "Особенности здоровья сохранены": "Health features saved",
  "Профиль обновлён": "Profile updated", "Профиль не создан": "Profile not created",
  "Показатели здоровья сохранены": "Health metrics saved",
  "Настройки сохранены": "Settings saved",
  "Данные обновлены и появились на главной, в истории и графиках.":
    "Data updated and now appears on the home page, history and charts.",
  "Запись не найдена": "Entry not found", "Пока нет записей": "No records yet",
  "Раздел в разработке": "Section in progress",

  // Auth messages
  "Введите email": "Enter email", "Введите email и пароль": "Enter email and password",
  "Введите email тестового аккаунта": "Enter the test account email",
  "Пароль": "Password",
  "Укажите email — мы пришлём ссылку для сброса":
    "Enter your email — we'll send a reset link",
  "Письмо для сброса пароля отправлено": "Password reset email sent",
  "Не удалось отправить письмо": "Failed to send email",
  "Пароль обновлён": "Password updated",
  "Аккаунт создан. Теперь вы можете войти.": "Account created. You can sign in now.",
  "Вы успешно вошли": "Successfully signed in",
  "Пользователь не авторизован после регистрации": "Not authorized after sign up",
  "Пользователь с таким email уже зарегистрирован. Попробуйте войти или восстановить пароль.":
    "A user with this email already exists. Try signing in or resetting your password.",
  "Не удалось войти. Проверьте email и пароль. Если вы уже регистрировались несколько раз, попробуйте восстановить пароль или создать новый тестовый аккаунт.":
    "Sign in failed. Check email and password. If you've registered before, try resetting your password or create a new test account.",
  "Проверьте почту и перейдите по ссылке": "Check your email and follow the link",
  "Ошибка входа": "Sign in error", "Ошибка регистрации": "Sign up error",
  "Ошибка Auth": "Auth error",
  "Тестовый аккаунт сброшен": "Test account reset",
  "Голосовой ввод появится скоро": "Voice input coming soon",
  "Скоро": "Coming soon", "Скоро: голосовой дневник": "Coming soon: voice diary",
  "Рассказать о своём дне": "Tell about your day",
  "Платная версия скоро": "Paid version coming soon",
  "AI-анализ появится после подключения языковой модели.":
    "AI analysis will be available once the language model is connected.",
  "AI-анализ приёма пищи появится после подключения языковой модели.":
    "Meal AI analysis will be available once the language model is connected.",

  // Settings / units
  "Настройки приложения": "App settings",
  "Тема, язык, отображение": "Theme, language, display",
  "кг": "kg", "л": "l", "мл": "ml", "мм рт.ст.": "mmHg", "уд/мин": "bpm",
  "уровень": "level", "за день": "per day", "за сегодня": "today",
  "более 8 часов": "over 8 hours", "до 4 часов": "up to 4 hours",
  "4–8 часов": "4–8 hours",

  // Habits
  "Курение": "Smoking", "Алкоголь": "Alcohol", "Энергетики": "Energy drinks",
  "Сладкое": "Sweets", "Фастфуд": "Fast food",
  "Время за компьютером": "Screen time",
  "Образ жизни и ежедневные привычки": "Lifestyle and daily habits",
  "Курение, алкоголь, кофе, стресс, экранное время":
    "Smoking, alcohol, coffee, stress, screen time",
  "Электронные сигареты": "E-cigarettes",
  "Не курю": "Don't smoke", "Не пью": "Don't drink",
  "Не употребляю": "Don't consume", "Не ем": "Don't eat",
  "Иногда": "Sometimes", "Редко": "Rarely", "Часто": "Often",
  "Регулярно": "Regularly", "Ежедневно": "Daily",
  "Каждый день": "Every day", "1–2 раза в неделю": "1–2 times per week",
  "1 чашка": "1 cup", "2 чашки": "2 cups",
  "1 ложка": "1 spoon", "2 ложки": "2 spoons",
  "Сколько чашек": "How many cups", "Чашек": "Cups",
  "Высокий": "High", "Низкий": "Low", "Средний": "Medium",
  "Стресс": "Stress",

  // Health features
  "Хронические заболевания": "Chronic conditions",
  "Заболевания, ограничения, аллергии, важные симптомы":
    "Conditions, limitations, allergies, important symptoms",
  "Нет хронических заболеваний": "No chronic conditions",
  "Гипертония": "Hypertension", "Диабет": "Diabetes",
  "Инсулинорезистентность": "Insulin resistance",
  "Заболевания сердца": "Heart conditions",
  "Заболевания печени": "Liver conditions",
  "Заболевания почек": "Kidney conditions",
  "Заболевания щитовидной железы": "Thyroid conditions",
  "Анемия": "Anemia", "Мигрень": "Migraine", "Варикоз": "Varicose veins",
  "Панкреатит": "Pancreatitis", "Гастрит": "Gastritis", "ГЭРБ / изжога": "GERD / heartburn",
  "ЖКТ и питание": "GI and nutrition",
  "Аллергия на продукты": "Food allergies",
  "Какие продукты нельзя или плохо переносите":
    "Which foods are restricted or poorly tolerated",
  "Непереносимость глютена": "Gluten intolerance",
  "Непереносимость молочных продуктов": "Lactose intolerance",
  "Изжога": "Heartburn", "Вздутие": "Bloating", "Запоры": "Constipation",
  "Диарея": "Diarrhea", "Тяжесть после еды": "Heaviness after meals",
  "Лекарства и наблюдение врача": "Medications and doctor supervision",
  "Какие лекарства или препараты": "Which medications",
  "Что врач рекомендовал": "Doctor's recommendations",
  "Опорно-двигательный аппарат": "Musculoskeletal",
  "Ограничения для тренировок": "Workout limitations",
  "Боль в спине": "Back pain", "Боль в пояснице": "Lower back pain",
  "Боль в шее": "Neck pain", "Боль в коленях": "Knee pain",
  "Боль в суставах": "Joint pain", "Отёки": "Edema",
  "Ограничение подвижности": "Limited mobility",
  "Нельзя бегать": "Can't run", "Нельзя прыгать": "Can't jump",
  "Нельзя наклоны": "No bending", "Нельзя долго стоять": "Can't stand long",
  "Нельзя силовые нагрузки": "No strength training",
  "Нужны мягкие тренировки": "Need gentle workouts",
  "Только ходьба": "Walking only", "Только ЛФК": "Therapeutic exercise only",
  "После травмы": "Post-injury",
  "Женское здоровье": "Women's health", "Беременность": "Pregnancy",
  "После родов": "Postpartum", "Менопауза": "Menopause",
  "Перименопауза": "Perimenopause",
  "Регулярный цикл": "Regular cycle", "Нерегулярный цикл": "Irregular cycle",
  "Что ещё важно учитывать": "Anything else to consider",
  "Не актуально": "Not applicable", "Не проверено": "Not checked",
  "Не хочу указывать": "Prefer not to say", "Если другое — укажите": "If other, specify",
  "Другое": "Other", "другое": "other",
  "Нет": "No", "да": "yes", "нет": "no",

  // Footer / why
  "питанием": "nutrition", "весом": "weight", "водой": "water", "сном": "sleep",
  "настроением": "mood", "давлением": "blood pressure", "самочувствием": "well-being",

  // Legal
  "Политика конфиденциальности": "Privacy Policy",
  "Пользовательское соглашение": "Terms of Service",
  "Согласие на обработку данных": "Data Processing Consent",
  "Согласие на обработку персональных данных": "Personal Data Processing Consent",
  "Медицинский отказ": "Medical Disclaimer",
  "Отказ от медицинской ответственности": "Medical Disclaimer",
  "Настоящая Политика описывает, какие данные мы собираем и как их используем в приложении «Баланс жизни».":
    "This Policy describes what data we collect and how we use it in Balance of Life.",
  "Мы собираем только те данные, которые вы вводите самостоятельно: показатели здоровья, питание, сон, активность.":
    "We only collect data you enter yourself: health metrics, nutrition, sleep, activity.",
  "Данные хранятся в защищённом виде и используются исключительно для предоставления функций приложения и формирования персональных рекомендаций.":
    "Data is stored securely and used solely to provide app features and personal recommendations.",
  "Мы не передаём ваши персональные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законом.":
    "We do not share your personal data with third parties without your consent, except as required by law.",
  "Вы можете в любой момент удалить свой аккаунт и связанные данные через раздел «Профиль».":
    "You may delete your account and associated data at any time via the Profile section.",
  "Используя приложение «Баланс жизни», вы соглашаетесь с условиями настоящего Соглашения.":
    "By using Balance of Life, you agree to the terms of this Agreement.",
  "Приложение предоставляется «как есть» и предназначено для самостоятельного отслеживания показателей здоровья и образа жизни.":
    "The app is provided 'as is' for self-tracking of health and lifestyle metrics.",
  "Вы обязуетесь предоставлять достоверную информацию и использовать приложение в личных некоммерческих целях.":
    "You agree to provide accurate information and use the app for personal non-commercial purposes.",
  "Администрация вправе изменять функциональность приложения, добавлять платные разделы и обновлять условия Соглашения.":
    "The administration may change app functionality, add paid sections and update the Agreement.",
  "Я даю согласие на обработку моих персональных данных, указанных при регистрации и в процессе использования приложения «Баланс жизни».":
    "I consent to the processing of my personal data provided during registration and use of Balance of Life.",
  "Перечень данных: имя, email, дата рождения, пол, показатели здоровья (вес, рост, давление, пульс и т.д.), записи дневника.":
    "Data list: name, email, date of birth, gender, health metrics (weight, height, blood pressure, pulse, etc.), diary entries.",
  "Цель обработки: предоставление функций приложения, формирование статистики, аналитики и персональных рекомендаций.":
    "Processing purpose: providing app features, statistics, analytics and personal recommendations.",
  "Согласие даётся на срок использования приложения и может быть отозвано в любой момент путём удаления аккаунта.":
    "Consent is given for the period of app use and can be revoked at any time by deleting the account.",
  "Приложение «Баланс жизни» не является медицинским изделием и не предназначено для диагностики, лечения или профилактики заболеваний.":
    "Balance of Life is not a medical device and is not intended for diagnosis, treatment or prevention of diseases.",
  "Рекомендации и аналитика, формируемые приложением, носят информационный характер и не заменяют консультацию врача.":
    "App recommendations and analytics are informational and do not replace medical consultation.",
  "Перед изменением рациона, режима физической активности или приёмом лекарств обязательно проконсультируйтесь с лечащим врачом.":
    "Always consult your doctor before changing diet, exercise or medication.",
  "Разработчик не несёт ответственности за решения, принятые пользователем на основании данных приложения.":
    "The developer is not responsible for decisions made by the user based on app data.",
  "Это демонстрационный текст. Перед публикацией приложения замените его на финальную редакцию, согласованную с юристом.":
    "Demo text. Replace with a lawyer-approved final version before publishing.",
  "Это демонстрационный текст. Перед публикацией приложения замените его на финальную редакцию.":
    "Demo text. Replace with a final version before publishing.",
  "Редактируйте свои данные": "Edit your data",
  "обработкой персональных данных": "personal data processing",
  "отказом от медицинской ответственности": "medical disclaimer",
  "пользовательское соглашение": "terms of service",
  "Принимаю": "I accept", "Ознакомлен с": "I have read the",
  "Текущий email": "Current email", "вошёл": "signed in", "не вошёл": "not signed in",
  "проверка": "checking", "ошибка проверки": "check error",
};

// Word-by-word fallback for short phrases not in the map.
const WORDS: Record<string, string> = {
  "Привет": "Hi", "Назад": "Back", "и": "and", "в": "in", "на": "on",
};

let active = false;
const TEXT_ORIG = new WeakMap<Text, string>();
const ATTR_ORIG = new WeakMap<Element, Map<string, string>>();
const ATTRS = ["placeholder", "title", "aria-label", "alt"];

function translateText(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return s;
  if (MAP[trimmed]) return s.replace(trimmed, MAP[trimmed]);
  if (WORDS[trimmed]) return s.replace(trimmed, WORDS[trimmed]);
  // try concatenation pattern like "Привет, Анна 👋"
  const m = trimmed.match(/^(Привет),\s*(\S+)(.*)$/);
  if (m) return s.replace(trimmed, `Hi, ${m[2]}${m[3]}`);
  return s;
}

function hasCyrillic(s: string) {
  return /[\u0400-\u04FF]/.test(s);
}

function walkNode(node: Node, toEn: boolean) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node as Text;
    const parent = t.parentElement;
    if (parent && (parent.tagName === "SCRIPT" || parent.tagName === "STYLE")) return;
    if (toEn) {
      if (!TEXT_ORIG.has(t) && hasCyrillic(t.nodeValue || "")) {
        TEXT_ORIG.set(t, t.nodeValue || "");
      }
      const orig = TEXT_ORIG.get(t);
      if (orig) {
        const translated = translateText(orig);
        if (t.nodeValue !== translated) t.nodeValue = translated;
      }
    } else {
      const orig = TEXT_ORIG.get(t);
      if (orig && t.nodeValue !== orig) t.nodeValue = orig;
    }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  // attributes
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v == null) continue;
    if (toEn) {
      let store = ATTR_ORIG.get(el);
      if (!store) { store = new Map(); ATTR_ORIG.set(el, store); }
      if (!store.has(a) && hasCyrillic(v)) store.set(a, v);
      const orig = store.get(a);
      if (orig) {
        const translated = translateText(orig);
        if (el.getAttribute(a) !== translated) el.setAttribute(a, translated);
      }
    } else {
      const store = ATTR_ORIG.get(el);
      const orig = store?.get(a);
      if (orig && el.getAttribute(a) !== orig) el.setAttribute(a, orig);
    }
  }
  // recurse
  const children = node.childNodes;
  for (let i = 0; i < children.length; i++) walkNode(children[i], toEn);
}

let observer: MutationObserver | null = null;
let applying = false;
let currentLang: "ru" | "en" = "ru";

function applyAll() {
  if (typeof document === "undefined") return;
  console.log("[i18n] applyAll lang=", currentLang);
  applying = true;
  try { walkNode(document.body, currentLang === "en"); }
  finally { applying = false; }
  console.log("[i18n] applyAll done, h1=", document.querySelector("h1")?.textContent);
}

export function setTranslatorLang(lang: "ru" | "en") {
  currentLang = lang;
  if (typeof document === "undefined") return;
  if (!observer) {
    observer = new MutationObserver((muts) => {
      if (applying) return;
      applying = true;
      try {
        for (const m of muts) {
          if (m.type === "characterData") walkNode(m.target, currentLang === "en");
          else if (m.type === "attributes" && m.target.nodeType === Node.ELEMENT_NODE) {
            walkNode(m.target, currentLang === "en");
          } else {
            m.addedNodes.forEach((n) => walkNode(n, currentLang === "en"));
          }
        }
      } finally { applying = false; }
    });
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ATTRS,
    });
  }
  if (!active && lang === "en") active = true;
  applyAll();
}
