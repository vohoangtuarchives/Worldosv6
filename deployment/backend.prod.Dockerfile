# Stage 1: Build FFI Library
FROM rust:latest AS ffi_builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# We will set Docker build context to the root folder.
COPY engine/ /app/
RUN cargo build --release -p worldos-ffi

# Stage 2: PHP Application
FROM php:8.4-fpm

# Install dependencies, including libffi-dev for FFI and gRPC build deps
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    libffi-dev \
    zlib1g-dev \
    g++ \
    make \
    cmake \
    && MAKEFLAGS="-j2" pecl install redis grpc protobuf \
    && docker-php-ext-enable redis grpc protobuf \
    && docker-php-ext-configure ffi --with-ffi \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip opcache pcntl bcmath sockets ffi

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy code from backend folder (context is root)
COPY backend/ /var/www

# Copy the compiled shared library from the ffi_builder stage
COPY --from=ffi_builder /app/target/release/libworldos_ffi.so /var/www/ffi_lib/worldos_ffi.so

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

# Keep a copy of public for entrypoint
RUN cp -a /var/www/public /var/www/public.from-image

COPY backend/scripts/entrypoint.prod.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
