<?php

namespace Tests\Feature;

use App\Services\Content\ContentManifestValidator;
use App\Services\Content\CpContentValidator;
use Tests\TestCase;

class ContentManifestValidationTest extends TestCase
{
    public function test_cp_content_passes_schema_and_path_checks(): void
    {
        $base = base_path();
        $schema = $base.DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'schemas';

        $legacy = new ContentManifestValidator($base.DIRECTORY_SEPARATOR.'content', $schema);
        $legacy->validateAll();
        $this->assertFalse($legacy->hasErrors(), implode("\n", $legacy->errors()));

        $cp = new CpContentValidator($base.DIRECTORY_SEPARATOR.'content'.DIRECTORY_SEPARATOR.'cp', $schema);
        $cp->validateAll();
        $this->assertFalse($cp->hasErrors(), implode("\n", $cp->errors()));
    }
}
