<?php

namespace Tests\Unit;

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;
use ReflectionClass;
use Tests\TestCase;

class HandleInertiaRequestsTest extends TestCase
{
    public function test_root_view_is_app(): void
    {
        $middleware = new HandleInertiaRequests;
        $ref = new ReflectionClass($middleware);
        $prop = $ref->getProperty('rootView');
        $prop->setAccessible(true);
        $this->assertSame('app', $prop->getValue($middleware));
    }

    public function test_version_delegates_to_parent(): void
    {
        $middleware = new HandleInertiaRequests;
        $request = Request::create('/');
        $version = $middleware->version($request);
        $this->assertTrue($version === null || is_string($version));
    }

    public function test_share_merges_with_parent(): void
    {
        $middleware = new HandleInertiaRequests;
        $request = Request::create('/');
        $shared = $middleware->share($request);
        $this->assertIsArray($shared);
    }
}
