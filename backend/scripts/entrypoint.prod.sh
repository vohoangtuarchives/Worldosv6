#!/bin/sh
set -e
# When backend_public volume is mounted at /var/www/public, it may be empty. Populate from image copy.
if [ -d /var/www/public.from-image ] && [ -z "$(ls -A /var/www/public 2>/dev/null)" ]; then
  cp -a /var/www/public.from-image/. /var/www/public/
  chown -R www-data:www-data /var/www/public
fi
exec "$@"
