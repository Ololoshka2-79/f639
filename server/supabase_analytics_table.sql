-- SQL скрипт для создания таблицы аналитики в Supabase.
-- Пожалуйста, выполните этот скрипт в разделе SQL Editor вашей панели управления Supabase.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  username text,
  first_name text,
  phone text,
  event text NOT NULL,
  product_id text,
  order_id text,
  delivery_type text,
  pvz_address text,
  amount numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON public.analytics_events (user_id);
CREATE INDEX IF NOT EXISTS analytics_events_event_idx ON public.analytics_events (event);

-- Настройки RLS (Row Level Security)
-- Разрешаем чтение и запись всем для упрощения (в реальном приложении можно закрыть доступ из браузера напрямую, т.к. мы работаем через свой сервер)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Так как мы работаем через Service Role Key на сервере, политики RLS не будут блокировать сервер.
-- Но если мы захотим писать напрямую с клиента, нужно будет добавить политики. Мы будем писать через сервер.
