FROM php:8.2-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite mbstring bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
    && touch database/database.sqlite \
    && chmod -R 775 storage bootstrap/cache database

EXPOSE 10000

# Cada vez que arranca el contenedor: deja la base de datos al dia
# (migraciones) y prende el servidor de Laravel escuchando en el puerto
# que Render le asigne.
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
