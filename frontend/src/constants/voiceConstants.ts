/**
 * Voice options for text-to-speech functionality
 */

export interface VoiceOption {
    value: string;
    label: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
    { value: 'en-US-Neural2-F', label: 'Female (Neural)' },
    { value: 'en-US-Neural2-D', label: 'Male (Neural)' },
    { value: 'en-US-Wavenet-F', label: 'Female (Wavenet)' },
    { value: 'en-US-Wavenet-D', label: 'Male (Wavenet)' },
    { value: 'en-US-Studio-O', label: 'Female (Studio)' },
    { value: 'en-US-Studio-M', label: 'Male (Studio)' },
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
