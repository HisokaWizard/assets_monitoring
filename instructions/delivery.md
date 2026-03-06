# Инструкция по деплою на Raspberry Pi 4

## Часть 1: Как работают домены и реестры (кратко)

### Что такое домен и как он устроен

Домен — это читаемое имя, которое связывается с IP-адресом сервера. Иерархия домена: `example.com` состоит из TLD `.com` и SLD `example`. Регистратор — компания (Namecheap, GoDaddy, Reg.ru), которая продает право использования домена. DNS-серверы хранят записи типа A (IP), CNAME (алиасы), MX (почта). При покупке домена вы платите за право использования на 1-10 лет. Бесплатные домены (.tk, .ml, .ga, .cf, .gq) предоставляются компанией Freenom (сейчас частично недоступна) или аналогами — они требуют продления каждые 1-12 месяцев и могут быть отобраны при неактивности.

### Как работает реестр

Реестр доменов — это организация, управляющая TLD (например, Verisign для .com). Регистраторы (GoDaddy, Namecheap) — посредники между вами и реестром. При регистрации домена информация добавляется в центральную базу данных WHOIS. DNS-серверы по всему миру кэшируют эти записи (обычно TTL 1-24 часа). Когда пользователь вводит домен в браузере, DNS-резолвер находит ближайший DNS-сервер с актуальной записью и направляет запрос на ваш сервер по IP-адресу из A-записи.

### Как получить бесплатный домен

1. Зарегистрируйтесь на [Freenom](https://www.freenom.com) (может быть недоступен)
2. Альтернативы: [EU.org](https://eu.org) (бесплатные .eu.org), [Dynu](https://www.dynu.com) (бесплатные .ddns)
3. После регистрации выберите домен (например, `myapp.tk`)
4. В настройках DNS укажите A-запись с IP-адресом вашего домашнего интернета
5. На роутере настройте проброс портов 80 (HTTP) и 443 (HTTPS) на Raspberry Pi

---

## Часть 2: Настройка Raspberry Pi 4

### Обоснование выбора инструментов

| Инструмент | Назначение | Почему выбрано |
|------------|------------|----------------|
| **Nginx** | Веб-сервер, reverse proxy | Легкий, производительный, стандарт индустрии. Лучше Apache для Node.js |
| **PM2** | Process Manager для Node.js | Автоперезапуск при падении, логирование, кластеризация. Лучше чем systemd для Node.js приложений |
| **UFW** | Firewall | Проще iptables, интегрирован в Ubuntu/Debian |
| **Certbot** | SSL сертификаты | Автоматическое получение и обновление Let's Encrypt бесплатно |
| **GitHub Actions** | CI/CD | Бесплатен для публичных репозиториев, простая настройка |

### Почему НЕ Docker в данном случае

- **Ресурсы Raspberry Pi 4**: 4-8GB RAM, Docker требует дополнительных ресурсов
- **Сложность настройки**: Docker Compose + Nginx требует больше конфигурации
- **Обновления**: Без Docker проще обновлять через git pull
- **Мониторинг**: PM2 дает простой CLI для мониторинга процессов
- **Для данного проекта**: 2 сервиса (frontend static + backend API) не требуют контейнеризации

Если в будущем появится больше сервисов (Redis, Celery, PostgreSQL) — тогда Docker будет оправдан.

---

## Детальный план настройки

### Шаг 1: Подготовка Raspberry Pi

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка базовых инструментов
sudo apt install -y curl git nginx ufw certbot python3-certbot-nginx

# Установка Node.js 18+ (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версий
node --version    # v18.x.x
nginx -v
pm2 --version
```

### Шаг 2: Настройка firewall (UFW)

```bash
# Включение firewall
sudo ufw enable

# Разрешение SSH (важно!)
sudo ufw allow 22/tcp

# Разрешение HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверка статуса
sudo ufw status
```

### Шаг 3: Настройка Backend с PM2

```bash
# Установка PM2 глобально
sudo npm install -g pm2

# Перейдите в директорию проекта на Raspberry
cd /home/pi/projects/assets_monitoring

# Установка зависимостей
cd backend && npm install --production

# Создание .env.production файла
cp .env .env.production
# Отредактируйте переменные окружения

# Запуск с PM2
cd /home/pi/projects/assets_monitoring/backend
pm2 start dist/main.js --name backend-app

# Настройка автозапуска
pm2 startup
# Выполните команду, которую выведет pm2

# Сохранение конфигурации
pm2 save
```

**PM2 конфигурация (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'backend-app',
    script: 'dist/main.js',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

### Шаг 4: Настройка Frontend

```bash
# На Raspberry в директории проекта
cd /home/pi/projects/assets_monitoring/frontend

# Создание production билда
npm run build

# Создание директории для фронтенда
sudo mkdir -p /var/www/assets-monitoring
sudo cp -r dist/* /var/www/assets-monitoring/
sudo chown -R www-data:www-data /var/www/assets-monitoring
```

### Шаг 5: Конфигурация Nginx

```bash
# Создание конфигурации
sudo nano /etc/nginx/sites-available/assets-monitoring
```

```nginx
server {
    listen 80;
    server_name your-domain.tk;

    # Frontend (SPA)
    location / {
        root /var/www/assets-monitoring;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket поддержка (если нужно)
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/assets-monitoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 6: Настройка SSL (Let's Encrypt)

```bash
# Получение сертификата
sudo certbot --nginx -d your-domain.tk

# Автоматическое обновление (проверить работу)
sudo certbot renew --dry-run

# Добавление в cron для автообновления
sudo crontab -e
# Добавить: 0 0 * * * certbot renew --quiet
```

### Шаг 7: Настройка проброса портов на роутере

1. Войдите в настройки роутера (обычно 192.168.1.1)
2. Найдите "Port Forwarding" или "Перенаправление портов"
3. Добавьте правила:
   - Внешний порт 80 → внутренний IP Raspberry:80
   - Внешний порт 443 → внутренний IP Raspberry:443
4. Сохраните и перезагрузите роутер

### Шаг 8: Настройка Dynamic DNS (если нет статического IP)

Если у вас динамический IP от провайдера:

1. Зарегистрируйтесь на [No-IP](https://www.noip.com) или используйте встроенный в роутер DDNS
2. Настройте обновление IP на ваш домен
3. В настройках Freenom/регистратора укажите CNAME на No-IP домен

### Шаг 9: CI/CD с GitHub Actions

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Raspberry Pi

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Build Backend
        run: |
          cd backend
          npm ci
          npm run build

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy to Raspberry Pi
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.RASPBERRY_HOST }}
          username: ${{ secrets.RASPBERRY_USER }}
          key: ${{ secrets.RASPBERRY_SSH_KEY }}
          script: |
            cd /home/pi/projects/assets_monitoring
            git pull origin main
            
            # Backend
            cd backend
            npm ci --production
            npm run build
            pm2 restart backend-app
            
            # Frontend
            cd ../frontend
            npm run build
            sudo cp -r dist/* /var/www/assets-monitoring/
            sudo chown -R www-data:www-data /var/www/assets-monitoring
```

**Настройка secrets в GitHub:**
- `RASPBERRY_HOST` — IP или домен Raspberry
- `RASPBERRY_USER` — пользователь (pi)
- `RASPBERRY_SSH_KEY` — приватный SSH ключ

### Шаг 10: Генерация SSH ключа для GitHub Actions

```bash
# На Raspberry
ssh-keygen -t ed25519 -C "github-actions"

# Добавить публичный ключ в authorized_keys
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Скопировать приватный ключ для GitHub Secrets
cat ~/.ssh/id_ed25519
```

---

## Проверка работоспособности

```bash
# Проверка статуса сервисов
pm2 status
sudo systemctl status nginx
sudo ufw status

# Просмотр логов
pm2 logs backend-app

# Тест с локального机器
curl http://localhost
curl http://localhost:3001/api/health

# Тест извне
curl https://your-domain.tk
```

---

## Команды управления

```bash
# Перезапуск приложений
pm2 restart backend-app

# Просмотр логов в реальном времени
pm2 logs --lines 50

# Мониторинг
pm2 monit

# Остановка
pm2 stop backend-app

# Обновление приложения
cd /home/pi/projects/assets_monitoring
git pull
cd backend && npm run build && pm2 restart backend-app
cd ../frontend && npm run build && sudo cp -r dist/* /var/www/assets-monitoring/
```
