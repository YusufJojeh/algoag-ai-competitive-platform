<?php

namespace Tests\Unit;

use App\Http\Controllers\AlgorithmAssistantController;
use App\Http\Controllers\Controller;
use App\Modules\Assistant\Actions\RunBenchmarkWorkflowAction;
use App\Modules\Assistant\Actions\SuggestAlgorithmsAction;
use App\Services\OllamaService;
use Tests\TestCase;

class ControllerTest extends TestCase
{
    public function test_controller_base_class_exists(): void
    {
        $this->assertTrue(class_exists(Controller::class));
    }

    public function test_algorithm_assistant_controller_extends_controller(): void
    {
        $this->assertInstanceOf(Controller::class, new AlgorithmAssistantController(
            app(OllamaService::class),
            app(SuggestAlgorithmsAction::class),
            app(RunBenchmarkWorkflowAction::class)
        ));
    }
}
