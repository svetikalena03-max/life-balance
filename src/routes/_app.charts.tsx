import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { useEntries, formatDateShort } from "@/lib/store";

export const Route = createFileRoute("/_app/charts")({
  component: ChartsPage,
});

function ChartsPage() {
  const { entries } = useEntries();
  const data = entries.map((e) => ({
    date: formatDateShort(e.date),
    weight: e.weight ?? null,
    water: e.water != null ? +(e.water / 1000).toFixed(2) : null,
    sleep: e.sleep ?? null,
    systolic: e.systolic ?? null,
    diastolic: e.diastolic ?? null,
    pulse: e.pulse ?? null,
    energy: e.energy ?? null,
  }));

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Графики" subtitle="Динамика по дням" />
        <Card className="p-8 text-center text-muted-foreground">
          Нет данных. Заполните дневник и страницу «Здоровье», чтобы увидеть графики.
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Графики" subtitle="Динамика по дням" />

      <ChartCard title="Вес, кг">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" domain={["dataMin - 0.5", "dataMax + 0.5"]} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
          <Line type="monotone" dataKey="weight" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4 }} connectNulls />
        </LineChart>
      </ChartCard>

      <ChartCard title="Вода, л">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
          <Bar dataKey="water" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Сон, часов">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
          <Line type="monotone" dataKey="sleep" stroke="var(--chart-5)" strokeWidth={3} dot={{ r: 4 }} connectNulls />
        </LineChart>
      </ChartCard>

      <ChartCard title="Давление, мм рт.ст.">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
          <Line type="monotone" dataKey="systolic" name="Верхнее" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="diastolic" name="Нижнее" stroke="var(--chart-4)" strokeWidth={3} dot={{ r: 4 }} connectNulls />
        </LineChart>
      </ChartCard>

      <ChartCard title="Пульс, уд/мин">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
          <Line type="monotone" dataKey="pulse" stroke="var(--chart-2)" strokeWidth={3} dot={{ r: 4 }} connectNulls />
        </LineChart>
      </ChartCard>

      <ChartCard title="Энергия, 1–10">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" domain={[0, 10]} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
          <Bar dataKey="energy" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}
