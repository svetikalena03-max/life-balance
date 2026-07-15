# Баланс жизни

Персональное приложение для ведения дневника питания, здоровья, воды, сна, настроения, привычек и самочувствия. Проект помогает фиксировать ежедневные показатели, смотреть историю и использовать персональные рекомендации.

## Технологии

- React
- TanStack Router / TanStack Start
- Vite
- Supabase
- Tailwind CSS

## Запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте локальный файл окружения на основе `.env.example` и заполните значения переменных:

```bash
cp .env.example .env
```

3. Запустите приложение в режиме разработки:

```bash
npm run dev
```

4. Для проверки production-сборки выполните:

```bash
npm run build
```

## Доступные команды

- `npm run dev` - запуск локального сервера разработки.
- `npm run build` - production-сборка.
- `npm run build:dev` - сборка в development-режиме.
- `npm run preview` - предпросмотр собранного приложения.
- `npm run lint` - проверка ESLint.
- `npm run format` - форматирование Prettier.

## Переменные окружения

Проект использует переменные окружения для Supabase и серверных AI-функций. Ниже перечислены только названия переменных, без значений и секретов:

- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Не коммитьте реальные значения ключей и токенов в репозиторий.
