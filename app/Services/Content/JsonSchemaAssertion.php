<?php

namespace App\Services\Content;

use Illuminate\Support\Facades\File;
use JsonSchema\Constraints\Constraint;
use JsonSchema\Validator;

class JsonSchemaAssertion
{
    /**
     * @param  array<string, mixed>  $data
     * @param  list<string>  $errors
     */
    public static function assertSchema(
        array $data,
        string $schemaRoot,
        string $schemaFile,
        string $contextPath,
        array &$errors
    ): void {
        $schemaPath = $schemaRoot.DIRECTORY_SEPARATOR.$schemaFile;
        if (! File::isFile($schemaPath)) {
            $errors[] = 'Schema not found: '.$schemaPath;

            return;
        }
        $schema = json_decode(File::get($schemaPath), false, 512, JSON_THROW_ON_ERROR);
        $payload = json_decode(json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), false);
        $validator = new Validator;
        $validator->validate($payload, $schema, Constraint::CHECK_MODE_COERCE_TYPES);
        if (! $validator->isValid()) {
            foreach ($validator->getErrors() as $err) {
                $pointer = $err['property'] ?? '';
                $msg = $err['message'] ?? '';
                $errors[] = "Schema {$schemaFile} at {$contextPath}{$pointer}: {$msg}";
            }
        }
    }
}
