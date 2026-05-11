<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetUiLocale
{
    /**
     * @var array<int, string>
     */
    private const SUPPORTED_LOCALES = ['ar', 'en'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->query('ui_locale');

        if (is_string($locale) && in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $request->session()->put('ui_locale', $locale);
            app()->setLocale($locale);
        } else {
            $sessionLocale = $request->session()->get('ui_locale');
            $fallbackLocale = config('app.locale', 'ar');
            $resolvedLocale = is_string($sessionLocale) && in_array($sessionLocale, self::SUPPORTED_LOCALES, true)
                ? $sessionLocale
                : $fallbackLocale;

            app()->setLocale($resolvedLocale);
        }

        return $next($request);
    }
}
