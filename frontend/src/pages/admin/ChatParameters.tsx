import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Button,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Stack,
    Card,
    CardContent,
} from '@mui/material';
import { Edit, CheckCircle, Add, Tune } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';

interface ChatParameter {
    id: number;
    uuid: string;
    name: string;
    system_prompt: string;
    temperature: number;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function ChatParameters() {
    const navigate = useNavigate();
    const { accessToken } = useAuth();
    const [parameters, setParameters] = useState<ChatParameter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activating, setActivating] = useState<string | null>(null);
    const [orderBy, setOrderBy] = useState<keyof ChatParameter>('is_active');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const handleSort = (property: keyof ChatParameter) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedParameters = [...parameters].sort((a, b) => {
        const aVal = a[orderBy];
        const bVal = b[orderBy];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
            return order === 'asc' ? (aVal ? 1 : -1) - (bVal ? 1 : -1) : (bVal ? 1 : -1) - (aVal ? 1 : -1);
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });

    const fetchParameters = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/chat-parameters/`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch chat parameters');
            const data = await response.json();
            setParameters(data.parameters);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParameters();
    }, [accessToken]);

    const handleActivate = async (uuid: string) => {
        setActivating(uuid);
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/chat-parameters/${uuid}/activate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to activate chat parameter');
            await fetchParameters();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setActivating(null);
        }
    };

    const activeParam = parameters.find(p => p.is_active);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tune sx={{ fontSize: 32, color: '#6366f1' }} />
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Chat Parameters
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    onClick={() => navigate('/admin/chat-parameters/new')}
                    startIcon={<Add />}
                >
                    Add Chat Parameter
                </Button>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Active Parameter Summary */}
            {activeParam && (
                <Card sx={{ mb: 3, bgcolor: 'primary.dark', color: 'white' }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <CheckCircle />
                            <Box>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                    Active Configuration
                                </Typography>
                                <Typography variant="h6">{activeParam.name}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    Temperature: {activeParam.temperature}
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            {/* Parameters Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderBy === 'name' ? order : 'asc'}
                                    onClick={() => handleSort('name')}
                                >
                                    Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'temperature'}
                                    direction={orderBy === 'temperature' ? order : 'asc'}
                                    onClick={() => handleSort('temperature')}
                                >
                                    Temperature
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'is_active'}
                                    direction={orderBy === 'is_active' ? order : 'asc'}
                                    onClick={() => handleSort('is_active')}
                                >
                                    Status
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'created_at'}
                                    direction={orderBy === 'created_at' ? order : 'asc'}
                                    onClick={() => handleSort('created_at')}
                                >
                                    Created
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedParameters.map((param) => (
                            <TableRow
                                key={param.uuid}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/admin/chat-parameters/${param.uuid}`)}
                            >
                                <TableCell>
                                    <Typography fontWeight={param.is_active ? 700 : 400}>
                                        {param.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>{param.temperature}</TableCell>
                                <TableCell>
                                    {param.is_active ? (
                                        <Chip
                                            label="Active"
                                            color="success"
                                            size="small"
                                            icon={<CheckCircle />}
                                        />
                                    ) : (
                                        <Chip label="Inactive" size="small" variant="outlined" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    {new Date(param.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        {!param.is_active && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleActivate(param.uuid);
                                                }}
                                                disabled={activating === param.uuid}
                                            >
                                                {activating === param.uuid ? (
                                                    <CircularProgress size={16} />
                                                ) : (
                                                    'Select'
                                                )}
                                            </Button>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/admin/chat-parameters/${param.uuid}/edit`);
                                            }}
                                        >
                                            <Edit />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {parameters.length === 0 && (
                <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                        No chat parameters configured. Create one to get started.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
