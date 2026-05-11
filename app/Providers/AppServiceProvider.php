<?php

namespace App\Providers;

use App\Models\AssistantSession;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Services\Assistant\AI\OpenAIVisionProvider;
use App\Services\Assistant\Contracts\AIProvider;
use App\Services\Assistant\Contracts\STTProvider;
use App\Services\Assistant\Contracts\TTSProvider;
use App\Services\Assistant\STT\WhisperSTT;
use App\Services\Assistant\TTS\OpenAITTS;
use App\Modules\Execution\Judges\LocalProcessJudge;
use App\Modules\Execution\Judges\StubCodeJudge;
use App\Models\AlgorithmSession;
use App\Models\CodeforcesSolution;
use App\Models\Submission;
use App\Modules\Problems\Models\Problem as ProblemModel;
use App\Modules\Problems\Policies\ProblemPolicy;
use App\Policies\AlgorithmSessionPolicy;
use App\Policies\AssistantSessionPolicy;
use App\Policies\CodeforcesSolutionPolicy;
use App\Policies\SubmissionPolicy;
use App\Services\Content\ContentFileReader;
use App\Services\Content\ContentIndexWriter;
use App\Services\Content\CpContentHasher;
use App\Services\Content\CpContentPaths;
use App\Services\Content\PatternLibraryService;
use App\Services\Content\PatternRepository;
use App\Services\Content\ProblemRepository;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Use LocalProcessJudge (real Python runner) when enabled; StubCodeJudge as safe fallback.
        // The production guard is enforced at resolution time so a misconfigured server
        // surfaces a clear error rather than silently exposing an RCE path.
        $this->app->singleton(CodeJudge::class, function ($app) {
            $useReal = (bool) config('judge.use_real_judge', false);
            if (! $useReal) {
                return $app->make(StubCodeJudge::class);
            }

            $isProduction = $app->environment('production');
            $hasSandbox = (string) config('judge.sandbox_driver', '') !== '';
            $allowUnsandboxed = (bool) config('judge.allow_unsandboxed_in_production', false);

            if ($isProduction && ! $hasSandbox && ! $allowUnsandboxed) {
                throw new \RuntimeException(
                    'JUDGE_USE_REAL=true is disallowed in production without a sandbox. '
                    .'Either set JUDGE_SANDBOX_DRIVER (docker, gvisor, firejail), '
                    .'or explicitly set JUDGE_ALLOW_UNSANDBOXED_IN_PROD=true to acknowledge the RCE risk.'
                );
            }

            return $app->make(LocalProcessJudge::class);
        });
        $this->app->singleton(AIProvider::class, OpenAIVisionProvider::class);
        $this->app->singleton(STTProvider::class, WhisperSTT::class);
        $this->app->singleton(TTSProvider::class, OpenAITTS::class);

        $this->app->singleton(CpContentPaths::class, function ($app) {
            return new CpContentPaths((string) config('content.cp_root'));
        });
        $this->app->singleton(ContentFileReader::class);
        $this->app->singleton(CpContentHasher::class);
        $this->app->singleton(PatternRepository::class);
        $this->app->singleton(PatternLibraryService::class);
        $this->app->singleton(ProblemRepository::class);
        $this->app->singleton(ContentIndexWriter::class);
    }

    public function boot(): void
    {
        Gate::policy(ProblemModel::class, ProblemPolicy::class);
        Gate::policy(AssistantSession::class, AssistantSessionPolicy::class);
        Gate::policy(AlgorithmSession::class, AlgorithmSessionPolicy::class);
        Gate::policy(CodeforcesSolution::class, CodeforcesSolutionPolicy::class);
        Gate::policy(Submission::class, SubmissionPolicy::class);
    }
}
