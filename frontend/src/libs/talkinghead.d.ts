export class TalkingHead {
    constructor(container: HTMLElement, options?: Record<string, unknown>);
    showAvatar(options: Record<string, unknown>): Promise<void>;
    speakAudio(audio: HTMLAudioElement, options?: Record<string, unknown>): Promise<void>;
    stopSpeaking(): void;
    start(): void;
    stop(): void;
}
