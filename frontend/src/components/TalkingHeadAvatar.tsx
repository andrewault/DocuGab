/**
 * TalkingHeadAvatar Component
 * 
 * Renders a 3D avatar that lip-syncs using the TalkingHead library.
 * Uses our backend TTS endpoint that returns TalkingHead-compatible format.
 */
import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { API_BASE } from '@/config/api';
// @ts-expect-error No declaration file for talkinghead.mjs
import { TalkingHead } from '@/libs/talkinghead/talkinghead.mjs';

interface TalkingHeadAvatarProps {
    text?: string;  // Text to speak and lip-sync
    voice?: string; // TTS voice name
    avatarUrl?: string; // URL of the GLB model
    isPlaying?: boolean;
}

// TalkingHead instance interface based on usage
interface TalkingHeadInstance {
    showAvatar: (options: Record<string, unknown>) => Promise<void>;
    speakText: (text: string, options?: Record<string, unknown>) => unknown;
    stopSpeaking: () => void;
    start: () => void;
    stop: () => void;
    audioCtx: AudioContext;
}

export default function TalkingHeadAvatar({ text, voice, avatarUrl, isPlaying }: TalkingHeadAvatarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const headRef = useRef<TalkingHeadInstance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastTextRef = useRef<string>('');

    const avatarContainerRef = useRef<HTMLDivElement>(null);

    // Initialize TalkingHead
    useEffect(() => {
        let mounted = true;

        const initTalkingHead = async () => {
            if (!avatarContainerRef.current) return;

            try {
                // Clear any existing content (safe because React controls the parent, not this inner div's children)
                avatarContainerRef.current.innerHTML = '';

                // Create TalkingHead instance with our TTS endpoint
                const head = new TalkingHead(avatarContainerRef.current, {
                    ttsEndpoint: `${API_BASE}/api/v1/speech/synthesize-avatar`,
                    cameraView: 'full', // "full", "mid", "upper" and "head"
                    cameraDistance: 0.5,
                    cameraX: 0,
                    cameraY: 0,
                    cameraRotateX: 0,
                    cameraRotateY: 0,
                    lightAmbientColor: 0xffffff,
                    lightAmbientIntensity: 1,
                    lightDirectColor: 0xffffff,
                    lightDirectIntensity: 0.5,
                    // Custom fetch to log errors
                    jwtGet: async () => { return ""; },
                });

                // Load avatar
                // If avatarUrl is just a name (e.g., "male"), construct full path
                // If it's already a path (starts with / or http), use as-is
                // Map known avatar names to available files
                const avatarNameMap: Record<string, string> = {
                    'default': 'avatar.glb',
                    'male': 'avatar.glb',
                    'female': 'avatar.glb',
                    'character': 'character.glb',
                    'avatar': 'avatar.glb',
                };

                let resolvedAvatarUrl = '/assets/avatars/avatar.glb'; // default
                if (avatarUrl && typeof avatarUrl === 'string') {
                    if (avatarUrl.startsWith('/') || avatarUrl.startsWith('http')) {
                        resolvedAvatarUrl = avatarUrl;
                    } else {
                        // Map avatar name to available file, or use the name directly
                        const avatarName = avatarUrl.replace('.glb', '');
                        const mappedFile = avatarNameMap[avatarName] || `${avatarName}.glb`;
                        resolvedAvatarUrl = `/assets/avatars/${mappedFile}`;
                    }
                }
                console.log('Loading avatar from:', resolvedAvatarUrl);
                await head.showAvatar({
                    url: resolvedAvatarUrl,
                    body: 'M',
                    lipsyncLang: 'en',
                    lipsyncModules: ['en'],
                });

                head.start();
                headRef.current = head;

                if (mounted) {
                    setIsLoading(false);
                }
            } catch (err: unknown) {
                console.error('Failed to initialize TalkingHead:', err);
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load avatar');
                    setIsLoading(false);
                }
            }
        };

        // Small timeout to ensure DOM is ready and to prevent AudioContext warning on immediate load
        const timer = setTimeout(initTalkingHead, 100);

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (headRef.current) {
                headRef.current.stop();
            }
        };
    }, [avatarUrl]);

    // Handle avatar change
    useEffect(() => {
        if (!headRef.current || !avatarUrl) return;

        const loadNewAvatar = async () => {
            setIsLoading(true);
            try {
                await headRef.current?.showAvatar({
                    url: avatarUrl,
                    body: 'M',
                    lipsyncLang: 'en',
                    lipsyncModules: ['en'],
                });
            } catch (err: unknown) {
                console.error('Failed to change avatar:', err);
                setError(err instanceof Error ? err.message : 'Failed to change avatar');
            } finally {
                setIsLoading(false);
            }
        };

        loadNewAvatar();
    }, [avatarUrl]);

    // Handle lip-sync when text changes and isPlaying is true
    useEffect(() => {
        if (!headRef.current) return;

        try {
            if (isPlaying && text && text !== lastTextRef.current) {
                lastTextRef.current = text;
                // Use speakText - this will call our TTS endpoint and animate
                const result = headRef.current.speakText(text, {
                    lipsyncLang: 'en',
                    ttsVoice: voice || 'Matthew',
                });
                if (result && typeof (result as Promise<void>).catch === 'function') {
                    (result as Promise<void>).catch(console.error);
                }
            } else if (!isPlaying) {
                headRef.current.stopSpeaking();
                lastTextRef.current = '';
            }
        } catch (err: unknown) {
            console.error('TalkingHead lip-sync error:', err);
            setError(err instanceof Error ? err.message : 'Speech synthesis failed');
        }
    }, [text, voice, isPlaying]);

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '100%',
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Dedicated container for 3D content - Isolated from React updates */}
            <div ref={avatarContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

            {/* Loading Overlay */}
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        zIndex: 10,
                    }}
                >
                    <CircularProgress color="primary" />
                </Box>
            )}

            {/* Error Overlay */}
            {error && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        right: 10,
                        p: 1,
                        bgcolor: 'rgba(255,0,0,0.8)',
                        color: 'white',
                        borderRadius: 1,
                        fontSize: '0.8rem',
                        zIndex: 30,
                    }}
                >
                    {error}
                </Box>
            )}
        </Box>
    );
}
