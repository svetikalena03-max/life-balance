import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";

type Recipe = Database["public"]["Tables"]["user_recipes"]["Row"];
const bucket = "personal-recipe-photos";

function lines(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Попробуйте ещё раз.";
}

export function PersonalRecipesPanel() {
  const { user, ready } = useAuth();
  const userId = user?.id;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  async function refresh(owner: string, accept: () => boolean = () => true) {
    const { data, error: loadError } = await supabase
      .from("user_recipes")
      .select("*")
      .eq("user_id", owner)
      .order("created_at", { ascending: false });
    if (loadError) throw loadError;
    const rows = data ?? [];
    if (!accept()) return;
    setRecipes(rows);
    const urls: Record<string, string> = {};
    await Promise.all(
      rows
        .filter((row) => row.photo_path)
        .map(async (row) => {
          const { data: signed } = await supabase.storage
            .from(bucket)
            .createSignedUrl(row.photo_path!, 3600);
          if (signed?.signedUrl) urls[row.id] = signed.signedUrl;
        }),
    );
    if (accept()) setPhotos(urls);
  }

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      setRecipes([]);
      setPhotos({});
      setError("");
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setRecipes([]);
    setPhotos({});
    refresh(userId, () => active)
      .catch(() => {
        if (active) setError("Личные рецепты пока недоступны. Общий каталог работает как обычно.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, userId]);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setIngredients("");
    setSteps("");
    setPhoto(null);
    setOpen(false);
  }

  function edit(recipe: Recipe) {
    setEditing(recipe.id);
    setTitle(recipe.title);
    setDescription(recipe.description);
    setIngredients(lines(recipe.ingredients).join("\n"));
    setSteps(lines(recipe.steps).join("\n"));
    setPhoto(null);
    setOpen(true);
    setError("");
    setNotice("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user || busy) return;
    const items = ingredients
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const instructions = steps
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (
      title.trim().length < 3 ||
      title.trim().length > 120 ||
      description.length > 1000 ||
      items.length < 1 ||
      items.length > 30 ||
      instructions.length < 1 ||
      instructions.length > 20 ||
      [...items, ...instructions].some((item) => item.length > 500)
    ) {
      setError(
        "Укажите название (3–120 символов), 1–30 ингредиентов и 1–20 шагов (до 500 символов в строке).",
      );
      return;
    }
    if (
      photo &&
      (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) ||
        photo.size > 5 * 1024 * 1024)
    ) {
      setError("Фото должно быть JPG, PNG или WebP размером до 5 МБ.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        ingredients: items,
        steps: instructions,
      };
      let row: Recipe;
      if (editing) {
        const { data, error: saveError } = await supabase
          .from("user_recipes")
          .update(payload)
          .eq("id", editing)
          .eq("user_id", user.id)
          .select()
          .single();
        if (saveError) throw saveError;
        row = data;
      } else {
        const { data, error: saveError } = await supabase
          .from("user_recipes")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single();
        if (saveError) throw saveError;
        row = data;
      }
      if (photo) {
        const ext =
          photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/${row.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, photo, { contentType: photo.type });
        if (uploadError) {
          setNotice(
            "Текст рецепта сохранён, но фото не загрузилось. Попробуйте добавить его позже.",
          );
        } else {
          const { error: pathError } = await supabase
            .from("user_recipes")
            .update({ photo_path: path })
            .eq("id", row.id)
            .eq("user_id", user.id);
          if (pathError) {
            await supabase.storage.from(bucket).remove([path]);
            setNotice("Текст рецепта сохранён, но фото не привязалось. Попробуйте ещё раз.");
          } else if (row.photo_path) {
            await supabase.storage.from(bucket).remove([row.photo_path]);
          }
        }
      }
      resetForm();
      await refresh(user.id);
      if (!photo) setNotice("Рецепт сохранён. Он виден только вам.");
    } catch (cause) {
      setError(`Не удалось сохранить рецепт: ${message(cause)}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(recipe: Recipe) {
    if (!user || busy || !window.confirm(`Удалить рецепт «${recipe.title}»?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (recipe.photo_path) {
        const { error: photoError } = await supabase.storage
          .from(bucket)
          .remove([recipe.photo_path]);
        if (photoError) throw photoError;
      }
      const { error: deleteError } = await supabase
        .from("user_recipes")
        .delete()
        .eq("id", recipe.id)
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;
      await refresh(user.id);
      if (editing === recipe.id) resetForm();
      setNotice("Рецепт удалён.");
    } catch (cause) {
      setError(`Не удалось удалить рецепт: ${message(cause)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3" aria-labelledby="personal-recipes-title">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 id="personal-recipes-title" className="text-lg font-bold">
            Мои рецепты
          </h2>
          <p className="text-sm text-muted-foreground">Ваши блюда видны только вам.</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            if (open) resetForm();
            else {
              setOpen(true);
              setError("");
            }
          }}
        >
          {open ? "Закрыть" : "Добавить рецепт"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {open && (
        <Card className="p-4">
          <form onSubmit={save} className="space-y-3">
            <h3 className="font-semibold">{editing ? "Редактировать рецепт" : "Новый рецепт"}</h3>
            <label className="block text-sm">
              Название
              <Input
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Описание (необязательно)
              <Textarea
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Ингредиенты — каждый с новой строки
              <Textarea
                required
                rows={4}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Овсяные хлопья — 50 г"
              />
            </label>
            <label className="block text-sm">
              Приготовление — каждый шаг с новой строки
              <Textarea
                required
                rows={4}
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="Смешать ингредиенты"
              />
            </label>
            <label className="block text-sm">
              Фото (необязательно, до 5 МБ)
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy ? "Сохраняю…" : "Сохранить рецепт"}
            </Button>
          </form>
        </Card>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Загружаю личные рецепты…</p>
      ) : recipes.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground">Пока нет своих рецептов.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden p-4">
              {photos[recipe.id] && (
                <img
                  src={photos[recipe.id]}
                  alt={recipe.title}
                  loading="lazy"
                  className="mb-3 aspect-video w-full rounded-lg object-cover"
                />
              )}
              <h3 className="font-semibold">{recipe.title}</h3>
              {recipe.description && (
                <p className="mt-1 text-sm text-muted-foreground">{recipe.description}</p>
              )}
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer">Ингредиенты и приготовление</summary>
                <h4 className="mt-2 font-medium">Ингредиенты</h4>
                <ul className="list-inside list-disc">
                  {lines(recipe.ingredients).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <h4 className="mt-2 font-medium">Шаги</h4>
                <ol className="list-inside list-decimal">
                  {lines(recipe.steps).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </details>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => edit(recipe)}
                >
                  Изменить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => remove(recipe)}
                >
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
