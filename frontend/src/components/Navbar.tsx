import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Description, Forum } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            <Toolbar>
                {/* Logo / Brand */}
                <Typography
                    variant="h6"
                    onClick={() => navigate('/')}
                    sx={{
                        cursor: 'pointer',
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mr: 4,
                    }}
                >
                    DocuGab
                </Typography>

                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Navigation Links */}
                <Button
                    color="inherit"
                    startIcon={<Description />}
                    onClick={() => navigate('/documents')}
                    sx={{
                        mx: 1,
                        opacity: location.pathname === '/documents' ? 1 : 0.7,
                        '&:hover': { opacity: 1 },
                    }}
                >
                    Documents
                </Button>
                <Button
                    color="inherit"
                    startIcon={<Forum />}
                    onClick={() => navigate('/chat')}
                    sx={{
                        mx: 1,
                        opacity: location.pathname === '/chat' ? 1 : 0.7,
                        '&:hover': { opacity: 1 },
                    }}
                >
                    Chat
                </Button>
            </Toolbar>
        </AppBar>
    );
}
