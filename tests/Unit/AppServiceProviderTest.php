<?php

namespace Tests\Unit;

use App\Providers\AppServiceProvider;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    public function test_register_runs_without_error(): void
    {
        $provider = new AppServiceProvider($this->app);
        $provider->register();
        $this->assertTrue(true);
    }

    public function test_boot_runs_without_error(): void
    {
        $provider = new AppServiceProvider($this->app);
        $provider->register();
        $provider->boot();
        $this->assertTrue(true);
    }
}
