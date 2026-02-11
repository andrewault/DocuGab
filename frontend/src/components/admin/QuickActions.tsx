import { Paper, Stack, Button, Box, Typography, useTheme } from '@mui/material';
import { Business, RecordVoiceOver, PersonAdd } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const actions = [
        { label: 'New Project', icon: <RecordVoiceOver />, path: '/admin/projects/new', color: 'primary' as const },
        { label: 'New Customer', icon: <Business />, path: '/admin/customers/new', color: 'success' as const },
        { label: 'New Admin User', icon: <PersonAdd />, path: '/admin/admin-users/new', color: 'info' as const },
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 4,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2
            }}
        >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Quick Actions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Start something new
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    {actions.map((action) => (
                        <Button
                            key={action.label}
                            variant="outlined"
                            color={action.color}
                            startIcon={action.icon}
                            onClick={() => navigate(action.path)}
                            size="small"
                        >
                            {action.label}
                        </Button>
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
}
