import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Stack,
    Box,
    Chip,
    CircularProgress,
    Tooltip
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Storage, Dns } from '@mui/icons-material';
import { API_BASE } from '@/config/api';
import { getAuthHeader } from '../../utils/authUtils';

interface HealthStatus {
    database: string;
    redis: string;
    version: string;
    database_error?: string;
    redis_error?: string;
}

export function HealthWidget() {
    const [status, setStatus] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const checkHealth = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/v1/admin/health`, {
                headers: getAuthHeader(),
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error('Health check failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const StatusIndicator = ({ label, status, error, icon }: { label: string, status: string, error?: string, icon: React.ReactNode }) => {
        const isHealthy = status === 'healthy';
        return (
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ color: 'text.secondary' }}>{icon}</Box>
                    <Typography variant="body2">{label}</Typography>
                </Stack>
                {status === 'unknown' ? (
                    <CircularProgress size={16} />
                ) : (
                    <Tooltip title={error || (isHealthy ? 'Operational' : 'Issue Detected')}>
                        <Chip
                            icon={isHealthy ? <CheckCircle style={{ color: 'white' }} /> : <ErrorIcon style={{ color: 'white' }} />}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            size="small"
                            sx={{
                                bgcolor: isHealthy ? '#4caf50' : '#f44336',
                                color: 'white',
                                fontWeight: 600,
                                '& .MuiChip-icon': { color: 'white' }
                            }}
                        />
                    </Tooltip>
                )}
            </Box>
        );
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    System Health
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    {loading && !status ? (
                        <Box display="flex" justifyContent="center" p={2}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <>
                            <StatusIndicator
                                label="Database"
                                status={status?.database || 'unknown'}
                                error={status?.database_error}
                                icon={<Storage fontSize="small" />}
                            />
                            <StatusIndicator
                                label="Redis Queue"
                                status={status?.redis || 'unknown'}
                                error={status?.redis_error}
                                icon={<Dns fontSize="small" />}
                            />
                            <Box pt={1} borderTop={1} borderColor="divider">
                                <Typography variant="caption" color="text.secondary">
                                    Backend Version: {status?.version || 'Unknown'}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
