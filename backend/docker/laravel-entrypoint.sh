#!/bin/sh
set -e

if [ ! -f /var/www/html/storage/database.sqlite ]; then
  mkdir -p /var/www/html/storage
  touch /var/www/html/storage/database.sqlite
fi

exec "$@"
