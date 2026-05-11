<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnalyzeRequest;
use App\Jobs\ProcessAnalysisJob;
use App\Models\AssistantMessage;
use App\Models\AssistantSession;
use App\Services\Assistant\Prompts\ModePrompts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class AssistantController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Assistant');
    }

    public function analyze(AnalyzeRequest $request): JsonResponse
    {
        $clientRequestId = $request->validated('client_request_id');
        $scopedClientRequestId = $this->scopedClientRequestId($request, $clientRequestId);

        $existing = AssistantMessage::where('client_request_id', $scopedClientRequestId)->first();
        if ($existing) {
            return response()->json([
                'session_id' => $existing->session_id,
                'message_id' => $existing->id,
                'status' => $existing->status,
                'client_request_id' => $clientRequestId,
            ], 200);
        }

        $session = $this->resolveSession($request);

        $framePath = null;
        $frameHash = null;
        if ($request->hasFile('frame')) {
            $framePath = $request->file('frame')->store('private/assistant-frames');
            $frameHash = hash_file('sha256', $request->file('frame')->getRealPath());
        }

        $audioPath = null;
        if ($request->hasFile('audio')) {
            $audioPath = $request->file('audio')->store('private/assistant-audio');
        }

        $mode = ModePrompts::normalize((string) $request->validated('mode'));

        $userMessage = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => $scopedClientRequestId,
            'role' => 'user',
            'content' => $request->validated('transcript'),
            'mode' => $mode,
            'frame_path' => $framePath,
            'frame_hash' => $frameHash,
            'audio_path' => $audioPath,
            'status' => AssistantMessage::STATUS_QUEUED,
        ]);

        ProcessAnalysisJob::dispatch($userMessage->id);

        Log::info('assistant.analyze.queued', [
            'session_id' => $session->id,
            'message_id' => $userMessage->id,
            'mode' => $mode,
            'has_audio' => $audioPath !== null,
        ]);

        return response()->json([
            'session_id' => $session->id,
            'message_id' => $userMessage->id,
            'status' => AssistantMessage::STATUS_QUEUED,
            'client_request_id' => $clientRequestId,
        ], 202);
    }

    public function sessions(Request $request): JsonResponse
    {
        $sessions = AssistantSession::where('user_id', $request->user()->id)
            ->withCount('messages')
            ->latest()
            ->paginate(20);

        return response()->json($sessions);
    }

    public function showSession(Request $request, int $session): JsonResponse
    {
        $sessionModel = AssistantSession::with('messages:id,session_id,role,content,mode,status,created_at')
            ->findOrFail($session);

        $this->authorize('view', $sessionModel);

        return response()->json($sessionModel);
    }

    public function messageStatus(Request $request, int $message): JsonResponse
    {
        $msg = AssistantMessage::findOrFail($message);
        $session = AssistantSession::findOrFail($msg->session_id);

        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        $assistantReply = $msg->role === 'assistant'
            ? $msg
            : $msg->replies()->latest('id')->first();

        $audioUrl = null;
        if ($assistantReply?->tts_path) {
            $audioUrl = URL::signedRoute('assistant.audio', ['message' => $assistantReply->id], now()->addHour());
        }

        return response()->json([
            'status' => $msg->status,
            'partial_text' => $msg->status === AssistantMessage::STATUS_STREAMING
                ? ($assistantReply?->content ?? $msg->content)
                : null,
            'full_text' => $msg->isTerminal()
                ? ($assistantReply?->content ?? ($msg->role === 'assistant' ? $msg->content : null))
                : null,
            'audio_ready' => $assistantReply?->tts_path !== null,
            'audio_url' => $audioUrl,
            'error' => $msg->error_message,
        ]);
    }

    public function cancelMessage(Request $request, int $message): JsonResponse
    {
        $msg = AssistantMessage::findOrFail($message);
        $session = AssistantSession::findOrFail($msg->session_id);

        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        if (! $msg->isCancellable()) {
            return response()->json(['error' => 'لا يمكن إلغاء هذه الرسالة.'], 422);
        }

        $msg->update(['status' => AssistantMessage::STATUS_CANCELLED]);

        Log::info('assistant.message.cancelled', [
            'session_id' => $session->id,
            'message_id' => $msg->id,
        ]);

        return response()->json(['status' => AssistantMessage::STATUS_CANCELLED]);
    }

    public function audio(Request $request, int $message)
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'الرابط الصوتي غير صالح أو منتهي الصلاحية.');
        }

        $msg = AssistantMessage::findOrFail($message);
        $session = AssistantSession::findOrFail($msg->session_id);

        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        if (! $msg->tts_path) {
            abort(404, 'لا يوجد ملف صوتي.');
        }

        $fullPath = Storage::disk('local')->path($msg->tts_path);
        if (! file_exists($fullPath)) {
            abort(404, 'الملف الصوتي غير موجود.');
        }

        return response()->file($fullPath, [
            'Content-Type' => 'audio/mpeg',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    private function resolveSession(AnalyzeRequest $request): AssistantSession
    {
        if ($request->filled('session_id')) {
            $session = AssistantSession::findOrFail($request->validated('session_id'));
            $this->authorize('update', $session);

            return $session;
        }

        return AssistantSession::create([
            'user_id' => $request->user()->id,
            'language' => $request->validated('language') ?? 'ar',
            'title' => Str::limit($request->validated('transcript') ?? '', 80) ?: null,
        ]);
    }

    private function scopedClientRequestId(Request $request, string $clientRequestId): string
    {
        $hash = md5($request->user()->id.'|'.$clientRequestId);

        // Format as UUID-like string (8-4-4-4-12) to match the column's expected format.
        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hash, 0, 8),
            substr($hash, 8, 4),
            substr($hash, 12, 4),
            substr($hash, 16, 4),
            substr($hash, 20, 12)
        );
    }
}
