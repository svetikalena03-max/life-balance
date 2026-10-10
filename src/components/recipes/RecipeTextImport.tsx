import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { importRecipeText } from "@/lib/recipe-import.functions";
import type { RecipeDraft } from "@/lib/recipes/import";

export function RecipeTextImport({ onDraft }: { onDraft: (draft: RecipeDraft) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(true);
  const runImport = useServerFn(importRecipeText);
  const speech = useSpeechRecognition();
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function analyze() {
    if (busy || speech.listening) return;
    setBusy(true);
    setError("");
    try {
      const result = await runImport({ data: { text: text.trim() } });
      if (!active.current) return;
      if (result.ok) onDraft(result.draft);
      else setError(result.error);
    } catch {
      if (active.current)
        setError(
          "Не удалось связаться с сервисом. Проверьте интернет и вход в аккаунт. Текст остался в поле.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3 sm:p-4">
      <p className="font-medium">Вставьте рецепт целиком или расскажите его голосом</p>
      <p className="text-sm text-muted-foreground">
        Укажите продукты, количества и приготовление. Текст будет отправлен в Яндекс для разбора.
        Ссылки и фотографии текста пока не распознаются.
      </p>
      <label className="block text-sm">
        Текст рецепта
        <Textarea
          rows={6}
          maxLength={8000}
          value={text}
          disabled={busy || speech.listening}
          onChange={(event) => setText(event.target.value)}
          placeholder="Сырники: 200 г творога, 1 яйцо, 2 столовые ложки муки. Смешать, сформировать сырники и обжарить до готовности."
        />
      </label>
      {speech.listening && (
        <p role="status" className="break-words text-sm">
          Слушаю… {[speech.finalText, speech.interimText].filter(Boolean).join(" ")}
        </p>
      )}
      {speech.speechError && (
        <p role="alert" className="text-sm text-destructive">
          {speech.speechError}
        </p>
      )}
      {!speech.supported && (
        <p className="text-sm text-muted-foreground">
          В этом браузере диктовка недоступна. Вставьте или напишите текст.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy || !speech.supported}
          onClick={() => {
            if (speech.listening) speech.stop();
            else
              speech.start((spoken) =>
                setText((previous) => `${previous.trim()} ${spoken}`.trim().slice(0, 8000)),
              );
          }}
        >
          {speech.listening ? (
            <Square className="mr-2 h-4 w-4" />
          ) : (
            <Mic className="mr-2 h-4 w-4" />
          )}
          {speech.listening ? "Завершить диктовку" : "Продиктовать"}
        </Button>
        <Button
          type="button"
          disabled={busy || speech.listening || text.trim().length < 20}
          onClick={analyze}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {busy ? "Разбираю рецепт…" : "Заполнить карточку"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        После разбора проверьте карточку. Рецепт сохранится только после вашего подтверждения.
      </p>
    </div>
  );
}
