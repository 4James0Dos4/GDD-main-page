# Własny obraz WordPress dla Coolify.
# Bazuje na oficjalnym wordpress:6.6-php8.2-apache i wbudowuje mu-pluginy
# (gdd-cms.php + obrazy) bez polegania na host-mountcie, który w Coolify
# montuje pusty katalog i przykrywa zawartość.
FROM wordpress:6.6-php8.2-apache

# Skopiuj mu-pluginy do obrazu (poza docelowym volume, by przetrwały mount).
COPY ./mu-plugins /opt/mu-plugins

# Oficjalny obraz WordPress uruchamia skrypty z /docker-entrypoint-pre.d/
# PRZED startem Apache. Volume wordpress_html jest już zamontowany, więc
# kopiujemy mu-pluginy do niego przy każdym starcie (cp -n = nie nadpisuj
# istniejących plików, idempotentne).
RUN mkdir -p /docker-entrypoint-pre.d \
 && printf '%s\n' \
    'mkdir -p /var/www/html/wp-content/mu-plugins' \
    'cp -rn /opt/mu-plugins/. /var/www/html/wp-content/mu-plugins/ 2>/dev/null || true' \
    > /docker-entrypoint-pre.d/10-mu-plugins.sh \
 && chmod +x /docker-entrypoint-pre.d/10-mu-plugins.sh
