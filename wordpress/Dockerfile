# Własny obraz WordPress dla Coolify.
# Bazuje na oficjalnym wordpress:6.6-php8.2-apache i wbudowuje mu-pluginy
# (gdd-cms.php + obrazy) bez polegania na host-mountcie, który w Coolify
# montuje pusty katalog i przykrywa zawartość.
FROM wordpress:6.6-php8.2-apache

# Skopiuj mu-pluginy do obrazu (poza docelowym volume, by przetrwały mount).
COPY ./mu-plugins /opt/mu-plugins

# Oficjalny obraz WordPress uruchamia skrypty z /docker-entrypoint-pre.d/
# PRZED startem Apache (po zamontowaniu volume wordpress_html). Kopiujemy
# mu-pluginy do volume przy każdym starcie. Shebang + log ułatwiają diagnozę.
RUN mkdir -p /docker-entrypoint-pre.d \
 && printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    'mkdir -p /var/www/html/wp-content/mu-plugins' \
    'cp -rf /opt/mu-plugins/. /var/www/html/wp-content/mu-plugins/' \
    'echo "gdd mu-plugins init: $(ls /var/www/html/wp-content/mu-plugins)" > /tmp/mu-plugins-init.log' \
    > /docker-entrypoint-pre.d/10-mu-plugins.sh \
 && chmod +x /docker-entrypoint-pre.d/10-mu-plugins.sh
