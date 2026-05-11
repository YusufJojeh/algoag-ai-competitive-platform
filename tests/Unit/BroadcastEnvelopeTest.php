<?php

namespace Tests\Unit;

use App\Modules\Realtime\Support\BroadcastEnvelope;
use Tests\TestCase;

class BroadcastEnvelopeTest extends TestCase
{
    public function test_wrap_includes_version_entity_and_correlation(): void
    {
        $payload = BroadcastEnvelope::wrap('codeforces_solution', 42, [
            'solutionId' => 42,
            'status' => 'completed',
        ], 'corr-123');

        $this->assertSame(BroadcastEnvelope::EVENT_VERSION, $payload['eventVersion']);
        $this->assertSame('codeforces_solution', $payload['entityType']);
        $this->assertSame(42, $payload['entityId']);
        $this->assertSame('corr-123', $payload['correlationId']);
        $this->assertSame('completed', $payload['status']);
        $this->assertArrayHasKey('occurredAt', $payload);
    }
}
