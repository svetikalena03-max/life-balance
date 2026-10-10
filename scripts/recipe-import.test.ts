import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-expect-error Node runs TypeScript directly for these isolated validation tests.
import { parseRecipeDraft, recipeImportInputSchema } from "../src/lib/recipes/import.ts";

const draft = {
  title: "Сырники",
  description: "",
  ingredients: ["Творог — 200 г", "Яйцо — 1 шт."],
  steps: ["Смешать продукты.", "Обжарить до готовности."],
};
test("keeps quantities and separates ingredients and steps", () => {
  assert.deepEqual(parseRecipeDraft(JSON.stringify(draft)), draft);
  assert.deepEqual(parseRecipeDraft("```json\n" + JSON.stringify(draft) + "\n```"), draft);
});
test("rejects non-recipes and incomplete or oversized model output", () => {
  for (const value of [
    { error: "not_recipe" },
    { ...draft, ingredients: [] },
    { ...draft, steps: Array(21).fill("Шаг") },
    { ...draft, ingredients: ["Мука\nСахар"] },
    { ...draft, user_id: "foreign-owner" },
  ]) {
    assert.throws(() => parseRecipeDraft(JSON.stringify(value)));
  }
});
test("limits source text and rejects extra client fields", () => {
  assert.equal(recipeImportInputSchema.safeParse({ text: "x".repeat(8001) }).success, false);
  assert.equal(
    recipeImportInputSchema.safeParse({ text: "Сырники и ингредиенты", user_id: "foreign-owner" })
      .success,
    false,
  );
  assert.equal(
    recipeImportInputSchema.safeParse({
      text: "Сырники: 200 г творога и яйцо. Смешать и обжарить.",
    }).success,
    true,
  );
});
