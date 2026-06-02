<?php
/**
 * Plugin Name: GDD CMS
 * Description: Custom post types and REST fields for Gospoda Dobrego Dźwięku Astro frontend.
 * Version: 1.2.0
 * Author: GDD
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('after_setup_theme', function () {
    add_theme_support('post-thumbnails', ['gdd_event', 'gdd_article']);
});

add_action('init', function () {
    register_post_type('gdd_event', [
        'labels' => [
            'name' => 'Wydarzenia',
            'singular_name' => 'Wydarzenie',
            'add_new_item' => 'Dodaj wydarzenie',
            'edit_item' => 'Edytuj wydarzenie',
            'new_item' => 'Nowe wydarzenie',
            'view_item' => 'Zobacz wydarzenie',
            'search_items' => 'Szukaj wydarzeń',
            'not_found' => 'Nie znaleziono wydarzeń',
        ],
        'public' => true,
        'menu_icon' => 'dashicons-calendar-alt',
        'has_archive' => true,
        'rewrite' => ['slug' => 'wydarzenia'],
        'show_in_rest' => true,
        'rest_base' => 'gdd_event',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'custom-fields', 'page-attributes'],
    ]);

    register_post_type('gdd_article', [
        'labels' => [
            'name' => 'Artykuły',
            'singular_name' => 'Artykuł',
            'add_new_item' => 'Dodaj artykuł',
            'edit_item' => 'Edytuj artykuł',
            'new_item' => 'Nowy artykuł',
            'view_item' => 'Zobacz artykuł',
            'search_items' => 'Szukaj artykułów',
            'not_found' => 'Nie znaleziono artykułów',
        ],
        'public' => true,
        'menu_icon' => 'dashicons-media-document',
        'has_archive' => true,
        'rewrite' => ['slug' => 'artykuly'],
        'show_in_rest' => true,
        'rest_base' => 'gdd_article',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'custom-fields', 'page-attributes'],
    ]);

    register_taxonomy('gdd_article_category', 'gdd_article', [
        'labels' => [
            'name' => 'Kategorie artykułów',
            'singular_name' => 'Kategoria artykułu',
            'search_items' => 'Szukaj kategorii',
            'popular_items' => 'Popularne kategorie',
            'all_items' => 'Wszystkie kategorie',
            'parent_item' => 'Kategoria nadrzędna',
            'parent_item_colon' => 'Kategoria nadrzędna:',
            'edit_item' => 'Edytuj kategorię',
            'update_item' => 'Zaktualizuj kategorię',
            'add_new_item' => 'Dodaj nową kategorię',
            'new_item_name' => 'Nazwa nowej kategorii',
            'menu_name' => 'Kategorie artykułów',
        ],
        'hierarchical' => true,
        'public' => true,
        'show_ui' => true,
        'show_admin_column' => true,
        'show_in_nav_menus' => false,
        'show_tagcloud' => false,
        'show_in_rest' => true,
        'rest_base' => 'gdd_article_category',
        'rewrite' => ['slug' => 'kategoria-artykulu'],
        'meta_box_cb' => false,
    ]);
});

const GDD_CMS_VERSION = '1.2.0';

add_action('admin_init', function (): void {
    if (get_option('gdd_cms_version') === GDD_CMS_VERSION) {
        return;
    }

    flush_rewrite_rules(false);
    update_option('gdd_cms_version', GDD_CMS_VERSION);
});

add_action('init', function () {
    $event_meta = [
        'event_date' => [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback' => '__return_true',
        ],
        'event_location' => [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback' => '__return_true',
        ],
        'event_cta_label' => [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback' => '__return_true',
        ],
    ];

    foreach ($event_meta as $key => $args) {
        register_post_meta('gdd_event', $key, $args);
    }

});

add_action('add_meta_boxes', function () {
    add_meta_box(
        'gdd_event_details',
        'Szczegóły wydarzenia',
        'gdd_render_event_details_box',
        'gdd_event',
        'normal',
        'high'
    );

    add_meta_box(
        'gdd_article_category_box',
        'Kategoria artykułu',
        'gdd_render_article_category_box',
        'gdd_article',
        'side',
        'default'
    );
});

function gdd_render_event_details_box(WP_Post $post): void
{
    wp_nonce_field('gdd_save_event_details', 'gdd_event_details_nonce');

    $event_date = get_post_meta($post->ID, 'event_date', true);
    $event_location = get_post_meta($post->ID, 'event_location', true);
    $event_cta_label = get_post_meta($post->ID, 'event_cta_label', true);
    ?>
    <p>
        <label for="gdd_event_date"><strong>Data wydarzenia</strong></label><br>
        <input
            type="date"
            id="gdd_event_date"
            name="gdd_event_date"
            value="<?php echo esc_attr($event_date); ?>"
            style="width: 100%; max-width: 320px;"
        >
    </p>
    <p>
        <label for="gdd_event_location"><strong>Miejsce</strong></label><br>
        <input
            type="text"
            id="gdd_event_location"
            name="gdd_event_location"
            value="<?php echo esc_attr($event_location); ?>"
            style="width: 100%;"
            placeholder="np. Warszawa / online"
        >
    </p>
    <p>
        <label for="gdd_event_cta_label"><strong>Tekst przycisku</strong></label><br>
        <input
            type="text"
            id="gdd_event_cta_label"
            name="gdd_event_cta_label"
            value="<?php echo esc_attr($event_cta_label); ?>"
            style="width: 100%; max-width: 420px;"
            placeholder="Domyślnie: Czytaj więcej"
        >
    </p>
    <?php
}

function gdd_render_article_category_box(WP_Post $post): void
{
    wp_nonce_field('gdd_save_article_category', 'gdd_article_category_nonce');

    $terms = get_terms([
        'taxonomy' => 'gdd_article_category',
        'hide_empty' => false,
        'orderby' => 'name',
        'order' => 'ASC',
    ]);

    if (is_wp_error($terms)) {
        $terms = [];
    }

    $assigned = wp_get_object_terms($post->ID, 'gdd_article_category', ['fields' => 'ids']);
    if (is_wp_error($assigned)) {
        $assigned = [];
    }

    $selected = !empty($assigned) ? (int) $assigned[0] : 0;
    $manage_url = admin_url('edit-tags.php?taxonomy=gdd_article_category&post_type=gdd_article');
    ?>
    <p>
        <label for="gdd_article_category_id"><strong>Kategoria</strong></label><br>
        <select id="gdd_article_category_id" name="gdd_article_category_id" style="width: 100%; margin-top: 4px;">
            <option value="0"<?php selected($selected, 0); ?>>— Bez kategorii —</option>
            <?php foreach ($terms as $term) : ?>
                <option value="<?php echo esc_attr((string) $term->term_id); ?>"<?php selected($selected, $term->term_id); ?>>
                    <?php echo esc_html($term->name); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </p>
    <p>
        <label for="gdd_new_article_category"><strong>Nowa kategoria</strong></label><br>
        <input
            type="text"
            id="gdd_new_article_category"
            name="gdd_new_article_category"
            value=""
            style="width: 100%; margin-top: 4px;"
            placeholder="np. Festiwale jazzowe"
        >
    </p>
    <p class="description">
        Wybierz istniejącą kategorię albo wpisz nową nazwę i kliknij „Aktualizuj”.
        <a href="<?php echo esc_url($manage_url); ?>">Zarządzaj kategoriami</a>
    </p>
    <?php
}

add_action('save_post_gdd_event', function (int $post_id): void {
    if (
        !isset($_POST['gdd_event_details_nonce']) ||
        !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['gdd_event_details_nonce'])), 'gdd_save_event_details')
    ) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $fields = [
        'gdd_event_date' => 'event_date',
        'gdd_event_location' => 'event_location',
        'gdd_event_cta_label' => 'event_cta_label',
    ];

    foreach ($fields as $input => $meta_key) {
        if (isset($_POST[$input])) {
            update_post_meta($post_id, $meta_key, sanitize_text_field(wp_unslash($_POST[$input])));
        } else {
            delete_post_meta($post_id, $meta_key);
        }
    }
});

add_action('save_post_gdd_article', function (int $post_id): void {
    if (
        !isset($_POST['gdd_article_category_nonce']) ||
        !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['gdd_article_category_nonce'])), 'gdd_save_article_category')
    ) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $term_ids = [];

    if (isset($_POST['gdd_article_category_id'])) {
        $category_id = (int) $_POST['gdd_article_category_id'];
        if ($category_id > 0) {
            $term_ids[] = $category_id;
        }
    }

    if (isset($_POST['gdd_new_article_category'])) {
        $new_name = sanitize_text_field(wp_unslash($_POST['gdd_new_article_category']));
        if ($new_name !== '') {
            $existing = term_exists($new_name, 'gdd_article_category');
            if ($existing) {
                $term_ids[] = (int) (is_array($existing) ? $existing['term_id'] : $existing);
            } else {
                $created = wp_insert_term($new_name, 'gdd_article_category');
                if (!is_wp_error($created)) {
                    $term_ids[] = (int) $created['term_id'];
                }
            }
        }
    }

    $term_ids = array_values(array_unique(array_filter($term_ids)));

    if (empty($term_ids)) {
        wp_set_object_terms($post_id, [], 'gdd_article_category');
        return;
    }

    wp_set_object_terms($post_id, $term_ids, 'gdd_article_category');
});
