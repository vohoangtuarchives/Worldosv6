FROM php:8.4-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip opcache pcntl bcmath sockets

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy code
COPY . /var/www

# Install dependencies (no dev).
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Set permissions early for artisan commands
RUN chown -R www-data:www-data /var/www

# Warm up package discovery and optimization (no DB needed for these)
RUN php artisan package:discover --ansi \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Keep a copy of public for entrypoint (when backend_public volume is mounted over /var/www/public)
RUN cp -a /var/www/public /var/www/public.from-image

COPY scripts/entrypoint.prod.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
