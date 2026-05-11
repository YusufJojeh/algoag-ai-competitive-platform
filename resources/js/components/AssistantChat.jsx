import AudioPlayer from './AudioPlayer';

export default function AssistantChat({ messages = [], currentPartialText = '' }) {
    if (messages.length === 0 && !currentPartialText) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-500 text-sm">لا توجد رسائل بعد — شارك شاشتك واكتب فكرتك للبدء</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {messages.map((msg, i) => (
                <div
                    key={msg.id || i}
                    className={`rounded-xl p-4 ${
                        msg.role === 'user'
                            ? 'bg-slate-800/50 border border-slate-700'
                            : 'bg-emerald-900/20 border border-emerald-700/30'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-sky-400' : 'text-emerald-400'}`}>
                            {msg.role === 'user' ? 'أنت' : 'المساعد'}
                        </span>
                        {msg.mode && (
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{msg.mode}</span>
                        )}
                    </div>
                    <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.audioUrl && (
                        <div className="mt-2">
                            <AudioPlayer src={msg.audioUrl} />
                        </div>
                    )}
                </div>
            ))}

            {currentPartialText && (
                <div className="rounded-xl p-4 bg-emerald-900/20 border border-emerald-700/30">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-emerald-400">المساعد</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{currentPartialText}</p>
                </div>
            )}
        </div>
    );
}
