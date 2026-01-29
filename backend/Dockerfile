FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist

FROM php:8.2-cli
WORKDIR /var/www/html

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
  && docker-php-ext-install \
    pdo_mysql \
    pdo_sqlite \
    mbstring \
    bcmath \
    gd \
    zip \
  && rm -rf /var/lib/apt/lists/*

COPY --from=vendor /app/vendor /var/www/html/vendor
COPY . /var/www/html
COPY docker/laravel-entrypoint.sh /usr/local/bin/laravel-entrypoint

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000
ENTRYPOINT ["laravel-entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
