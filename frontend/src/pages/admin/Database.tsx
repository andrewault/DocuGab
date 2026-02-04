import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    useTheme,
    Card,
    CardContent,
} from '@mui/material';
import {
    CloudUpload,
    Download,
    Delete,
    Backup as BackupIcon,
    Refresh,
    CleaningServices,
    Storage,
    Cloud,
    Terminal,
} from '@mui/icons-material';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthProvider';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import { API_BASE } from '@/config/api';

interface BackupFile {
    filename: string;
    size: number;
    created_at: string;
    source?: 's3' | 'local';
}

interface BackupConfig {
    provider: 's3' | 'local';
    bucket?: string;
    region?: string;
}

export default function Database() {
    const { user: currentUser } = useAuth();
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [config, setConfig] = useState<BackupConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [vacuuming, setVacuuming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            const [backupsRes, configRes] = await Promise.all([
                fetch(`${API_BASE}/api/v1/admin/database/backups`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/api/v1/admin/database/config`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })
            ]);

            if (!backupsRes.ok) throw new Error('Failed to fetch backups');
            // Config might fail on old backend versions, treat as local if so? 
            // Better to assume it works if we just deployed it.

            const backupsData = await backupsRes.json();
            setBackups(backupsData);

            if (configRes.ok) {
                const configData = await configRes.json();
                setConfig(configData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleCreateBackup = async () => {
        try {
            setCreating(true);
            setError(null);
            setSuccess(null);

            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE}/api/v1/admin/database/backup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to create backup');
            }

            const data = await response.json();
            setSuccess(`Backup created: ${data.filename}`);
            await fetchBackups();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setCreating(false);
        }
    };

    const handleVacuum = async () => {
        try {
            setVacuuming(true);
            setError(null);
            setSuccess(null);

            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE}/api/v1/admin/database/vacuum`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to vacuum database');
            }

            const data = await response.json();
            setSuccess(data.message);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setVacuuming(false);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${API_BASE}/api/v1/admin/database/backups/${filename}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to download backup');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const handleDelete = async (filename: string) => {
        try {
            setError(null);
            setSuccess(null);

            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${API_BASE}/api/v1/admin/database/backups/${filename}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete backup');
            }

            setSuccess(`Backup deleted: ${filename}`);
            setDeleteDialog(null);
            await fetchBackups();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return formatInUserTimezone(
            dateString,
            currentUser?.timezone || 'America/Los_Angeles',
            'PPpp'
        );
    };

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isS3 = config?.provider === 's3';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                py: 4,
            }}
        >
            <Container maxWidth={false} sx={{ px: 3 }}>
                <AdminBreadcrumbs items={[{ label: 'Database' }]} />

                {/* Header with Title and Actions */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {isS3 ? (
                            <Cloud sx={{ fontSize: 32, color: '#0ea5e9' }} /> // Sky blue for cloud
                        ) : (
                            <Storage sx={{ fontSize: 32, color: '#6366f1' }} />
                        )}
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                background: isS3
                                    ? 'linear-gradient(90deg, #0ea5e9, #3b82f6)'
                                    : 'linear-gradient(90deg, #6366f1, #10b981)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {isS3 ? 'Cloud Database' : 'Database'}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={fetchBackups}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={vacuuming ? <CircularProgress size={20} /> : <CleaningServices />}
                            onClick={handleVacuum}
                            disabled={vacuuming}
                        >
                            VACUUM
                        </Button>

                        {!isS3 && (
                            <>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<CloudUpload />}
                                >
                                    Upload Backup
                                    <input
                                        type="file"
                                        hidden
                                        accept=".sql.gz"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                setError(null);
                                                setSuccess(null);

                                                const formData = new FormData();
                                                formData.append('file', file);

                                                const token = localStorage.getItem('access_token');
                                                const response = await fetch(`${API_BASE}/api/v1/admin/database/restore`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`,
                                                    },
                                                    body: formData,
                                                });

                                                if (!response.ok) {
                                                    const data = await response.json();
                                                    throw new Error(data.detail || 'Failed to upload backup');
                                                }

                                                const data = await response.json();
                                                setSuccess(data.message);
                                                await fetchBackups();
                                            } catch (err) {
                                                setError(err instanceof Error ? err.message : 'Unknown error');
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={creating ? <CircularProgress size={20} /> : <BackupIcon />}
                                    onClick={handleCreateBackup}
                                    disabled={creating}
                                >
                                    Create Backup
                                </Button>
                            </>
                        )}
                    </Stack>
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {/* S3 Restoration Info */}
                {isS3 && (
                    <Card sx={{ mb: 4, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" gap={1} mb={2}>
                                <Terminal color="warning" />
                                <Typography variant="h6" color="text.primary">
                                    Restoration Info
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Automatic backups are stored in S3 bucket <strong>{config?.bucket}</strong>.
                                Restoring directly via the web UI is disabled in cloud mode to prevent timeouts and connection issues.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                To restore a backup, use the following CLI command from your terminal:
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    overflowX: 'auto',
                                    fontSize: '0.85rem',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {`aws s3 cp s3://${config?.bucket}/<filename> - | gunzip | psql -h $DB_HOST -U $DB_USER -d $DB_NAME`}
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Backups Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Filename</TableCell>
                                <TableCell align="right">Size</TableCell>
                                <TableCell align="right">Created</TableCell>
                                <TableCell align="right">Location</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : backups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography color="text.secondary">
                                            No backups found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                backups.map((backup) => (
                                    <TableRow key={backup.filename} hover>
                                        <TableCell>{backup.filename}</TableCell>
                                        <TableCell align="right">{formatBytes(backup.size)}</TableCell>
                                        <TableCell align="right">{formatDate(backup.created_at)}</TableCell>
                                        <TableCell align="right">
                                            {backup.source === 's3' ? 'AWS S3' : 'Local Disk'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleDownload(backup.filename)}
                                                title="Download"
                                            >
                                                <Download />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => setDeleteDialog(backup.filename)}
                                                title="Delete"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialog !== null}
                    onClose={() => setDeleteDialog(null)}
                >
                    <DialogTitle>Delete Backup?</DialogTitle>
                    <DialogContent>
                        Are you sure you want to delete <strong>{deleteDialog}</strong>?
                        <br />
                        This action cannot be undone.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
                        <Button
                            color="error"
                            variant="contained"
                            onClick={() => deleteDialog && handleDelete(deleteDialog)}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
