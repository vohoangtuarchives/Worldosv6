# Stage: PHP Application with FrankenPHP (Laravel Octane)
FROM dunglas/frankenphp:1-php8.4-alpine

# Install system dependencies (Alpine uses apk)
RUN apk add --no-cache \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    oniguruma-dev \
    libxml2-dev \
    postgresql-dev \
    icu-dev \
    libpng-dev \
    shadow \
    bash

# Install PHP extensions using install-php-extensions (available in FrankenPHP image)
RUN install-php-extensions \
    pdo_pgsql \
    pgsql \
    zip \
    opcache \
    pcntl \
    bcmath \
    sockets \
    redis \
    intl \
    gd

# PHP Configuration for high performance
RUN echo "max_execution_time=300" >> /usr/local/etc/php/conf.d/docker-php-timeouts.ini \
    && echo "memory_limit=1G" >> /usr/local/etc/php/conf.d/docker-php-timeouts.ini

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy only composer.json for caching
COPY backend/composer.json /var/www/

# Install dependencies (use update since we modified composer.json manually)
RUN composer config process-timeout 600 \
    && composer config audit.block-insecure false \
    && composer update --no-interaction --prefer-dist --no-dev --no-scripts --no-autoloader

# Now copy the rest of the application code
COPY backend/ /var/www

# Finalize autoloader and run scripts
RUN rm -f bootstrap/cache/*.php && composer dump-autoload --optimize --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Warm up package discovery and optimization
RUN php artisan package:discover --ansi \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# Keep a copy of public
RUN cp -a /var/www/public /var/www/public.from-image

COPY backend/scripts/entrypoint.prod.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Port for standard FrankenPHP server
EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["frankenphp", "php-server", "--listen", ":8000", "--document-root", "/var/www/public"]
