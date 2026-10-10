import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path, dependencies) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name], console });
  return exports;
}

test("recipe requests retain diabetes and varicose beyond the first three conditions", () => {
  const store = load("../src/lib/store.ts", { react: {}, "@/integrations/supabase/client": {} });
  const { buildSuggestRecipesRequest } = load("../src/lib/recipes/suggest-profile.ts", {
    "@/lib/store": store,
  });
  const result = buildSuggestRecipesRequest({
    healthFeatures: {
      chronic: ["gastritis", "hypertension", "anemia", "diabetes", "varicose", "thrombosis"],
      women: ["pregnancy"],
      gi: ["lactose"],
      doctorRec: "Назначенный врачом план",
    },
  });
  for (const label of ["Диабет", "Варикоз", "Тромб", "Беременность"])
    assert.ok(result.conditions.includes(label));
  assert.ok(result.restrictions.includes("Назначенный врачом план"));
  assert.equal(buildSuggestRecipesRequest(null).conditions, undefined);
});

test("failed health write keeps previously saved restrictions in profile state", async () => {
  const states = [];
  const effects = [];
  let index = 0;
  const react = {
    useState(initial) {
      const slot = index++;
      if (!(slot in states)) states[slot] = initial;
      return [
        states[slot],
        (value) => {
          states[slot] = value;
        },
      ];
    },
    useRef: (value) => ({ current: value }),
    useCallback: (fn) => fn,
    useEffect: (fn) => {
      effects.push(fn);
    },
  };
  const supabase = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: { user: { id: "owner" } } } }),
    },
    from: (table) => ({
      upsert: async () => ({ error: table === "health_features" ? { message: "offline" } : null }),
    }),
  };
  const { useProfile } = load("../src/lib/store.ts", {
    react,
    "@/integrations/supabase/client": { supabase },
  });
  useProfile();
  effects[0]();
  await Promise.resolve();
  const saved = { name: "User", healthFeatures: { women: ["pregnancy"] } };
  states[1] = saved;
  index = 0;
  const { setProfile } = useProfile();
  const result = await setProfile({ ...saved, healthFeatures: { women: [] } });
  assert.equal(result.ok, false);
  assert.equal(states[1], saved);
});

test("account changes remount family and health forms, clearing private state and pending responses", () => {
  for (const page of ["family", "glucose", "pregnancy", "health-features", "recipes"]) {
    let owner = "first-account";
    const route = load(`../src/routes/_app.${page}.tsx`, {
      "@tanstack/react-router": { createFileRoute: () => (options) => options },
      "react/jsx-runtime": { jsx: (type, props, key) => ({ type, props, key }) },
      react: {},
      "@tanstack/react-start": {},
      "lucide-react": {},
      sonner: {},
      "@/lib/auth": { useAuth: () => ({ user: owner ? { id: owner } : null, ready: true }) },
      "@/lib/pregnancy": {},
      "@/lib/store": {},
      "@/lib/recipes": {},
      "@/lib/ai.functions": {},
      "@/integrations/supabase/client": {},
      ...Object.fromEntries(
        [
          "PageHeader",
          "ui/button",
          "ui/card",
          "ui/input",
          "ui/label",
          "ui/textarea",
          "ui/checkbox",
          "ui/alert",
          "recipes/RecipeCard",
          "recipes/RecipeRecommendationCard",
          "recipes/RecipeFiltersPanel",
          "recipes/PersonalRecipesPanel",
        ].map((name) => [`@/components/${name}`, {}]),
      ),
    }).Route;
    const first = route.component();
    owner = "second-account";
    const second = route.component();
    assert.notEqual(first.key, second.key, page);
    owner = null;
    assert.notEqual(route.component().key, second.key, page);
  }
});
