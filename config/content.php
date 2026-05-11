<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Competitive programming content (canonical JSON tree)
    |--------------------------------------------------------------------------
    */
    'cp_root' => env('CONTENT_CP_ROOT', base_path('content/cp')),

    /*
    |--------------------------------------------------------------------------
    | Legacy YAML manifests (optional; may be empty after full migration)
    |--------------------------------------------------------------------------
    */
    'legacy_root' => env('CONTENT_LEGACY_ROOT', base_path('content')),

    'schema_root' => env('CONTENT_SCHEMA_ROOT', base_path('docs/schemas')),

    /*
    |--------------------------------------------------------------------------
    | Cache TTL for parsed CP bundles (null = forever; keyed by content hash)
    |--------------------------------------------------------------------------
    */
    'cache_ttl' => env('CONTENT_CACHE_TTL'),

    'index_enabled' => env('CONTENT_INDEX_ENABLED', true),

];
