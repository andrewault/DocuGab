/**
 * Voice options for text-to-speech functionality
 */

export interface VoiceOption {
    value: string;
    label: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
    { value: 'Joanna', label: 'Joanna (Female)' },
    { value: 'Matthew', label: 'Matthew (Male)' },
    { value: 'Salli', label: 'Salli (Female)' },
    { value: 'Ivy', label: 'Ivy (Child)' },
    { value: 'Justin', label: 'Justin (Male)' },
    { value: 'Kevin', label: 'Kevin (Male)' },
];

/**
 * Get the display label for a voice value
 */
export function getVoiceLabel(value: string): string {
    const voice = VOICE_OPTIONS.find(v => v.value === value);
    return voice?.label || value;
}

/**
 * Sample text for voice testing
 */
export const VOICE_TEST_TEXT = "This is what this voice sounds like.";
