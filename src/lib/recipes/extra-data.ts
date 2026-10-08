import type { Recipe, RecipeGoalTag, RecipeMealType } from "./types";

type RecipeDraft = Omit<Recipe, "imageUrl" | "ingredients" | "steps" | "tags" | "searchIngredients"> & {
  ingredients: Array<[id: string, name: string, amount: string]>;
  steps: string[];
  mealTypes: RecipeMealType[];
  goals?: RecipeGoalTag[];
};

function add(draft: RecipeDraft): Recipe {
  const { ingredients, steps, mealTypes, goals, ...base } = draft;
  return {
    ...base,
    imageUrl: `/recipes/${draft.id}.webp`,
    ingredients: ingredients.map(([id, name, amount]) => ({ id, name, amount })),
    steps: steps.map((text, index) => ({ order: index + 1, text })),
    tags: { goals: goals ?? ["maintain", "health"], conditions: ["none"], mealTypes },
    searchIngredients: ingredients.map(([, name]) => name.toLocaleLowerCase("ru")),
  };
}

/** Дополнительные домашние блюда. КБЖУ ориентировочные и зависят от продуктов и порции. */
export const EXTRA_RECIPES: Recipe[] = [
  add({
    id: "apple-cottage-casserole", title: "Творожная запеканка с яблоком",
    description: "Нежная домашняя запеканка без сложных ингредиентов.",
    prepMinutes: 10, cookMinutes: 35, servings: 4, calories: 215,
    macros: { protein: 17, fat: 8, carbs: 19 }, mealTypes: ["breakfast", "snack"],
    ingredients: [["curd", "Творог 5%", "400 г"], ["eggs", "Яйца", "2 шт."], ["apple", "Яблоко", "1 шт."], ["semolina", "Манная крупа", "2 ст. л."]],
    steps: ["Разогрейте духовку до 180 °C.", "Смешайте творог с яйцами и манкой, добавьте мелко нарезанное яблоко.", "Выложите в форму и запекайте 30–35 минут до готовности."],
  }),
  add({
    id: "egg-spinach-toast", title: "Тост с яйцом и шпинатом",
    description: "Быстрый завтрак с хрустящим хлебом и зеленью.",
    prepMinutes: 5, cookMinutes: 7, servings: 1, calories: 250,
    macros: { protein: 14, fat: 12, carbs: 21 }, mealTypes: ["breakfast"],
    ingredients: [["bread", "Цельнозерновой хлеб", "1 ломтик"], ["egg", "Яйцо", "1 шт."], ["spinach", "Шпинат", "50 г"], ["oil", "Масло растительное", "1 ч. л."]],
    steps: ["Подсушите хлеб на сухой сковороде.", "Потушите шпинат с небольшим количеством масла 2 минуты.", "Приготовьте яйцо до полной готовности и выложите на тост со шпинатом."],
  }),
  add({
    id: "millet-pumpkin-porridge", title: "Пшённая каша с тыквой",
    description: "Тёплая каша с мягкими кусочками тыквы.",
    prepMinutes: 10, cookMinutes: 25, servings: 2, calories: 235,
    macros: { protein: 7, fat: 5, carbs: 40 }, mealTypes: ["breakfast"],
    ingredients: [["millet", "Пшено", "100 г"], ["pumpkin", "Тыква", "200 г"], ["milk", "Молоко", "250 мл"], ["water", "Вода", "200 мл"]],
    steps: ["Тщательно промойте пшено.", "Нарежьте тыкву небольшими кубиками и соедините с пшеном, молоком и водой.", "Варите под крышкой на слабом огне 20–25 минут, помешивая."],
  }),
  add({
    id: "banana-oat-pancakes", title: "Овсяные оладьи с бананом",
    description: "Небольшие оладьи из банана, яйца и овсяных хлопьев.",
    prepMinutes: 7, cookMinutes: 12, servings: 2, calories: 220,
    macros: { protein: 9, fat: 6, carbs: 34 }, mealTypes: ["breakfast", "snack"],
    ingredients: [["banana", "Банан", "1 шт."], ["oats", "Овсяные хлопья", "80 г"], ["egg", "Яйцо", "1 шт."], ["milk", "Молоко", "50 мл"]],
    steps: ["Разомните банан вилкой.", "Смешайте с яйцом, овсянкой и молоком; дайте постоять 5 минут.", "Жарьте небольшие оладьи на антипригарной сковороде до полной готовности с обеих сторон."],
  }),
  add({
    id: "yogurt-berry-parfait", title: "Йогурт с ягодами и овсянкой",
    description: "Холодный завтрак, который можно собрать за несколько минут.",
    prepMinutes: 5, cookMinutes: 0, servings: 1, calories: 195,
    macros: { protein: 10, fat: 5, carbs: 28 }, mealTypes: ["breakfast", "snack"],
    ingredients: [["yogurt", "Натуральный йогурт", "180 г"], ["berries", "Ягоды", "80 г"], ["oats", "Овсяные хлопья", "20 г"]],
    steps: ["Выложите йогурт в миску или стакан.", "Добавьте ягоды и овсяные хлопья.", "Подавайте сразу или охладите 10 минут."],
  }),
  add({
    id: "turkey-meatball-soup", title: "Суп с фрикадельками из индейки",
    description: "Домашний овощной суп с небольшими фрикадельками.",
    prepMinutes: 15, cookMinutes: 30, servings: 4, calories: 205,
    macros: { protein: 19, fat: 7, carbs: 16 }, mealTypes: ["lunch"],
    ingredients: [["turkey", "Фарш индейки", "400 г"], ["potato", "Картофель", "2 шт."], ["carrot", "Морковь", "1 шт."], ["zucchini", "Кабачок", "150 г"], ["water", "Вода", "1,5 л"]],
    steps: ["Сформируйте из фарша маленькие фрикадельки.", "Доведите воду до кипения, положите нарезанные овощи и варите 10 минут.", "Добавьте фрикадельки и варите ещё 15–20 минут до полной готовности мяса."],
  }),
  add({
    id: "baked-cod-potatoes", title: "Треска с картофелем в духовке",
    description: "Простой обед из рыбы и запечённых овощей.",
    prepMinutes: 12, cookMinutes: 30, servings: 2, calories: 325,
    macros: { protein: 31, fat: 8, carbs: 30 }, mealTypes: ["lunch", "dinner"],
    ingredients: [["cod", "Филе трески", "300 г"], ["potato", "Картофель", "300 г"], ["carrot", "Морковь", "1 шт."], ["oil", "Оливковое масло", "1 ст. л."]],
    steps: ["Разогрейте духовку до 190 °C.", "Нарежьте картофель и морковь, перемешайте с маслом, запекайте 15 минут.", "Добавьте филе трески и готовьте ещё 15 минут до полной готовности рыбы."],
  }),
  add({
    id: "chicken-buckwheat-bowl", title: "Гречка с курицей и огурцом",
    description: "Сытный обед из крупы, курицы и свежего огурца.",
    prepMinutes: 10, cookMinutes: 20, servings: 2, calories: 370,
    macros: { protein: 33, fat: 9, carbs: 39 }, mealTypes: ["lunch"],
    ingredients: [["buckwheat", "Гречка", "120 г"], ["chicken", "Куриная грудка", "250 г"], ["cucumber", "Огурец", "1 шт."], ["oil", "Масло растительное", "1 ч. л."]],
    steps: ["Отварите гречку до готовности.", "Нарежьте курицу небольшими кусочками и приготовьте на сковороде до полной готовности.", "Подавайте с гречкой и нарезанным огурцом."],
  }),
  add({
    id: "vegetable-bean-stew", title: "Овощное рагу с белой фасолью",
    description: "Сезонные овощи с фасолью в томатном соусе.",
    prepMinutes: 15, cookMinutes: 25, servings: 3, calories: 265,
    macros: { protein: 11, fat: 8, carbs: 36 }, mealTypes: ["lunch", "dinner"],
    ingredients: [["beans", "Белая фасоль варёная", "300 г"], ["zucchini", "Кабачок", "1 шт."], ["carrot", "Морковь", "1 шт."], ["tomato", "Помидоры", "2 шт."], ["oil", "Масло растительное", "1 ст. л."]],
    steps: ["Нарежьте овощи небольшими кубиками.", "Тушите морковь и кабачок с маслом 10 минут.", "Добавьте помидоры и готовую фасоль, готовьте под крышкой ещё 15 минут."],
  }),
  add({
    id: "turkey-cabbage-rolls", title: "Голубцы с индейкой",
    description: "Домашние голубцы с рисом и нежирным фаршем.",
    prepMinutes: 25, cookMinutes: 45, servings: 4, calories: 285,
    macros: { protein: 22, fat: 9, carbs: 28 }, mealTypes: ["lunch", "dinner"],
    ingredients: [["cabbage", "Капустные листья", "8 шт."], ["turkey", "Фарш индейки", "400 г"], ["rice", "Рис сухой", "120 г"], ["tomato", "Томатное пюре", "200 г"], ["water", "Вода", "250 мл"]],
    steps: ["Отварите рис до полуготовности, капустные листья размягчите в кипятке.", "Смешайте рис с фаршем и заверните начинку в листья.", "Сложите голубцы в кастрюлю, залейте томатным пюре с водой и тушите 40–45 минут до полной готовности мяса."],
  }),
  add({
    id: "chicken-vegetable-bake", title: "Курица с овощами в духовке",
    description: "Куриная грудка и овощи в одной форме для запекания.",
    prepMinutes: 15, cookMinutes: 30, servings: 3, calories: 255,
    macros: { protein: 31, fat: 8, carbs: 14 }, mealTypes: ["dinner", "lunch"],
    ingredients: [["chicken", "Куриная грудка", "450 г"], ["cauliflower", "Цветная капуста", "300 г"], ["zucchini", "Кабачок", "1 шт."], ["carrot", "Морковь", "1 шт."], ["oil", "Масло растительное", "1 ст. л."]],
    steps: ["Разогрейте духовку до 190 °C.", "Нарежьте курицу и овощи, перемешайте с маслом и разложите в форме.", "Запекайте 25–30 минут до полной готовности курицы."],
  }),
  add({
    id: "fish-rice-bowl", title: "Рыба с рисом и стручковой фасолью",
    description: "Белая рыба с простым гарниром из риса и фасоли.",
    prepMinutes: 10, cookMinutes: 25, servings: 2, calories: 345,
    macros: { protein: 29, fat: 5, carbs: 43 }, mealTypes: ["dinner", "lunch"],
    ingredients: [["fish", "Филе белой рыбы", "300 г"], ["rice", "Бурый рис сухой", "120 г"], ["beans", "Стручковая фасоль", "200 г"], ["lemon", "Лимон", "1/2 шт."]],
    steps: ["Отварите рис по инструкции на упаковке.", "Приготовьте рыбу на пару или в духовке до полной готовности.", "Отварите стручковую фасоль и подавайте вместе с рыбой, рисом и лимоном."],
  }),
  add({
    id: "turkey-zucchini-patties", title: "Котлеты из индейки с кабачком",
    description: "Небольшие сочные котлеты для домашнего ужина.",
    prepMinutes: 15, cookMinutes: 20, servings: 3, calories: 235,
    macros: { protein: 28, fat: 10, carbs: 7 }, mealTypes: ["dinner", "lunch"],
    ingredients: [["turkey", "Фарш индейки", "450 г"], ["zucchini", "Кабачок", "200 г"], ["egg", "Яйцо", "1 шт."], ["cucumber", "Огурец", "1 шт."]],
    steps: ["Натрите кабачок и слегка отожмите лишнюю жидкость.", "Смешайте его с фаршем и яйцом, сформируйте небольшие котлеты.", "Готовьте под крышкой на сковороде или в духовке 18–20 минут до полной готовности фарша; подавайте с огурцом."],
  }),
  add({
    id: "buckwheat-mushrooms", title: "Гречка с шампиньонами",
    description: "Тёплая гречка с грибами и луком.",
    prepMinutes: 10, cookMinutes: 25, servings: 2, calories: 285,
    macros: { protein: 10, fat: 8, carbs: 45 }, mealTypes: ["dinner", "lunch"],
    ingredients: [["buckwheat", "Гречка сухая", "120 г"], ["mushrooms", "Шампиньоны", "250 г"], ["onion", "Лук", "1 шт."], ["oil", "Масло растительное", "1 ст. л."]],
    steps: ["Отварите гречку до готовности.", "Нарежьте шампиньоны и лук, готовьте на сковороде с маслом до испарения жидкости.", "Смешайте с гречкой и прогрейте 2 минуты."],
  }),
  add({
    id: "potato-vegetable-frittata", title: "Фриттата с картофелем и овощами",
    description: "Запечённый омлет с картофелем и сезонными овощами.",
    prepMinutes: 15, cookMinutes: 25, servings: 3, calories: 245,
    macros: { protein: 12, fat: 12, carbs: 23 }, mealTypes: ["dinner", "breakfast"],
    ingredients: [["eggs", "Яйца", "4 шт."], ["potato", "Картофель", "250 г"], ["tomato", "Помидор", "1 шт."], ["zucchini", "Кабачок", "150 г"], ["oil", "Масло растительное", "1 ч. л."]],
    steps: ["Отварите картофель до полуготовности и нарежьте ломтиками.", "Разложите картофель и овощи в смазанной форме, залейте взбитыми яйцами.", "Запекайте при 180 °C около 20–25 минут до полного схватывания яиц."],
  }),
  add({
    id: "apple-peanut-yogurt", title: "Йогурт с яблоком и арахисовой пастой",
    description: "Простой перекус с яблоком и ложкой пасты без сахара.",
    prepMinutes: 5, cookMinutes: 0, servings: 1, calories: 220,
    macros: { protein: 11, fat: 10, carbs: 22 }, mealTypes: ["snack"],
    ingredients: [["yogurt", "Натуральный йогурт", "180 г"], ["apple", "Яблоко", "1 шт."], ["peanut", "Арахисовая паста", "1 ч. л."]],
    steps: ["Нарежьте яблоко небольшими кусочками.", "Выложите йогурт в миску, добавьте яблоко.", "Добавьте чайную ложку арахисовой пасты и перемешайте."],
  }),
  add({
    id: "carrot-hummus", title: "Овощные палочки с хумусом",
    description: "Хрустящие овощи с нутовой пастой для перекуса.",
    prepMinutes: 10, cookMinutes: 0, servings: 2, calories: 190,
    macros: { protein: 6, fat: 9, carbs: 21 }, mealTypes: ["snack"],
    ingredients: [["carrot", "Морковь", "2 шт."], ["cucumber", "Огурец", "1 шт."], ["chickpeas", "Нут варёный", "150 г"], ["oil", "Оливковое масло", "1 ст. л."], ["lemon", "Лимонный сок", "1 ч. л."]],
    steps: ["Нарежьте морковь и огурец палочками.", "Измельчите варёный нут с маслом и лимонным соком до однородности.", "Подавайте овощи с готовым хумусом."],
  }),
  add({
    id: "cottage-cheese-peach", title: "Творог с персиком",
    description: "Быстрый фруктовый перекус без приготовления.",
    prepMinutes: 5, cookMinutes: 0, servings: 1, calories: 215,
    macros: { protein: 24, fat: 9, carbs: 12 }, mealTypes: ["snack", "breakfast"],
    ingredients: [["curd", "Творог 5%", "180 г"], ["peach", "Персик", "1 шт."]],
    steps: ["Вымойте и нарежьте персик дольками.", "Выложите творог в миску.", "Добавьте персик и подавайте."],
  }),
  add({
    id: "egg-cucumber-snack", title: "Яйцо с огурцом и хлебом",
    description: "Небольшой несладкий перекус из знакомых продуктов.",
    prepMinutes: 5, cookMinutes: 10, servings: 1, calories: 205,
    macros: { protein: 11, fat: 8, carbs: 21 }, mealTypes: ["snack", "breakfast"],
    ingredients: [["egg", "Яйцо", "1 шт."], ["cucumber", "Огурец", "1 шт."], ["bread", "Цельнозерновой хлеб", "1 ломтик"]],
    steps: ["Отварите яйцо вкрутую 9–10 минут.", "Нарежьте огурец и хлеб.", "Подавайте вместе с очищенным яйцом."],
  }),
  add({
    id: "berry-kefir-smoothie", title: "Кефирный напиток с ягодами",
    description: "Освежающий напиток из кефира и ягод.",
    prepMinutes: 5, cookMinutes: 0, servings: 1, calories: 135,
    macros: { protein: 8, fat: 3, carbs: 19 }, mealTypes: ["snack"],
    ingredients: [["kefir", "Кефир 1%", "250 мл"], ["berries", "Ягоды", "100 г"]],
    steps: ["Промойте ягоды; замороженные предварительно разморозьте.", "Измельчите ягоды с кефиром в блендере.", "Подавайте сразу."],
  }),
];
