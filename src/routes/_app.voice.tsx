import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceDayContent } from "@/components/VoiceDayContent";
import { PageHeader } from "@/components/PageHeader";
import { VOICE_DAY_TIPS, VOICE_EXAMPLE_PHRASES } from "@/lib/voice-prompts";
import { formatDateWeekday, todayISO, useEntries } from "@/lib/store";
import { Mic, Sparkles, MessageSquareQuote } from "lucide-react";

export const Route = createFileRoute("/_app/voice")({
  component: VoicePage,
});

function VoicePage() {
  const { entries } = useEntries();
  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);
  const [suggestion, setSuggestion] = useState<{ id: number; text: string } | null>(null);

  const filledFields = todayEntry
    ? [
        todayEntry.water != null && "вода",
        todayEntry.sleep != null && "сон",
        todayEntry.mood != null && "настроение",
        todayEntry.systolic != null && "давление",
        todayEntry.meals?.some((m) => m.food?.trim()) && "питание",
      ].filter(Boolean).length
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Голосовой дневник"
        subtitle="Расскажите о дне — AI заполнит дневник за вас"
        backTo="/home"
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-chart-5/90 via-primary/80 to-chart-2/70 p-6 text-primary-foreground shadow-lg">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20">
            <Mic className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm opacity-90">{formatDateWeekday(today)}</p>
            <h2 className="mt-1 text-xl font-bold">Один рассказ — весь день</h2>
            <p className="mt-2 text-sm opacity-90">
              Надиктуйте или напишите свободным текстом. AI извлечёт питание, воду, сон, давление и настроение.
            </p>
            {filledFields > 0 && (
              <p className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-xs">
                Сегодня уже заполнено: {filledFields} категорий. Новые данные добавятся, не перезаписав существующие.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Что рассказать</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_DAY_TIPS.map((tip) => (
            <div
              key={tip.title}
              className="rounded-xl border border-border bg-muted/30 p-3"
            >
              <p className="text-lg">{tip.icon}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{tip.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{tip.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Примеры фраз</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">Нажмите — фраза подставится в поле ввода ниже.</p>
        <div className="flex flex-col gap-2">
          {VOICE_EXAMPLE_PHRASES.map((phrase) => (
            <Button
              key={phrase}
              type="button"
              variant="outline"
              className="h-auto min-h-11 whitespace-normal px-3 py-2 text-left text-sm font-normal"
              onClick={() => setSuggestion({ id: Date.now(), text: phrase })}
            >
              {phrase}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold">Ваш рассказ</h2>
        <VoiceDayContent suggestedPhrase={suggestion} />
      </Card>
    </div>
  );
}
