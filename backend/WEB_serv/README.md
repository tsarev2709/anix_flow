# WEB_serv

Этот сервис отвечает за публичный API Anix Flow и оркестрацию фоновых задач. Структура подготовлена для развёртывания на Ubuntu 24.04 с использованием Docker или запуска напрямую через Uvicorn.

## Основные возможности
- FastAPI-приложение c асинхронными эндпоинтами.
- Подключение к PostgreSQL и Redis через конфигурацию.
- Заготовка для интеграции с GPT-прокси и GPU-сервисами.
- Health-checkи для систем мониторинга и балансировщиков.

## Быстрый старт (локально)
1. Создайте файл `.env` на основе [.env.example](./.env.example).
2. Установите зависимости:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Запустите сервер:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Структура каталога
```
WEB_serv/
├── README.md
├── requirements.txt
├── .env.example
└── app/
    ├── __init__.py
    ├── config.py
    ├── main.py
    ├── db.py
    ├── routers/
    │   ├── __init__.py
    │   ├── health.py
    │   └── projects.py
    └── schemas.py
```

## Следующие шаги
- Реализовать реальные модели SQLAlchemy и миграции.
- Настроить Celery worker и очереди Redis.
- Добавить аутентификацию и полный набор REST-эндпоинтов.
- Подключить логирование и метрики (Prometheus/Grafana).

> **Важно:** Не храните реальные секреты в репозитории. Используйте переменные окружения или менеджеры секретов.
