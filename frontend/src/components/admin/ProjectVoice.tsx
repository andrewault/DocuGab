import { useState } from 'react';
import { Box, Typography, Paper, Stack, Divider, Button } from '@mui/material';
import { VolumeUp } from '@mui/icons-material';
import { getVoiceLabel, VOICE_TEST_TEXT } from '../../constants/voiceConstants';
import type { Project } from '../../types/project';
import { API_BASE } from '@/config/api';

interface ProjectVoiceProps {
    project: Project;
}

export function ProjectVoice({ project }: ProjectVoiceProps) {
    const [testingVoice, setTestingVoice] = useState(false);

    const testVoice = async (voice: string) => {
        setTestingVoice(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/speech/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: VOICE_TEST_TEXT, voice }),
            });

            if (res.ok) {
                const audioBlob = await res.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                };

                audio.play();
            }
        } catch (error) {
            console.error('Voice test error:', error);
        } finally {
            setTestingVoice(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Avatar and Voice
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                <Box sx={{ flex: 1 }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Avatar
                            </Typography>
                            <Typography variant="body1" fontFamily="monospace">
                                {project.avatar?.name || 'Default (avatar.glb)'}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Voice Assistant
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="body1">
                                    {getVoiceLabel(project.voice)}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<VolumeUp />}
                                    onClick={() => testVoice(project.voice)}
                                    disabled={testingVoice}
                                >
                                    Test
                                </Button>
                            </Stack>
                        </Box>
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
}
