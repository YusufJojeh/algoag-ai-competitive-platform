export const assistantVisualStates = [
    'empty',
    'preview',
    'transcript-ready',
    'analyzing',
    'streaming',
    'completed',
    'failed',
    'audio-ready',
    'history',
] as const;

export const assistantModes = [
    { id: 'hint', label: 'hint' },
    { id: 'check', label: 'check' },
    { id: 'wrong', label: 'wrong' },
    { id: 'full', label: 'full' },
    { id: 'summarize', label: 'summarize' },
    { id: 'edge_cases', label: 'edge-cases' },
    { id: 'complexity', label: 'complexity' },
] as const;
