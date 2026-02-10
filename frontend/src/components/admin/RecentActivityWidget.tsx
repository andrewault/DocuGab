import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Box,
    Tab,
    Tabs,
    CircularProgress,
    Chip
} from '@mui/material';
import { RecordVoiceOver, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/config/api';
import { getAuthHeader } from '../../utils/authUtils';
import { formatDistanceToNow } from 'date-fns';

interface RecentProject {
    uuid: string;
    name: string;
    updated_at: string;
    customer_name: string;
    slug: string;
}

interface RecentUser {
    uuid: string;
    email: string;
    full_name: string;
    created_at: string;
    is_active: boolean;
}

interface ActivityData {
    projects: RecentProject[];
    users: RecentUser[];
}

export function RecentActivityWidget() {
    const navigate = useNavigate();
    const [data, setData] = useState<ActivityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/v1/admin/recent-activity`, {
                    headers: getAuthHeader(),
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error('Failed to fetch activity', error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, []);

    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'recently';
        }
    };

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                    <Tab label="Recent Projects" />
                    <Tab label="New Users" />
                </Tabs>
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 0 }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List disablePadding>
                        {tab === 0 && data?.projects.map((project, index) => (
                            <div key={project.uuid}>
                                {index > 0 && <Divider component="li" />}
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => navigate(`/admin/projects/${project.uuid}`)}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                <RecordVoiceOver />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={project.name}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary">
                                                        {project.customer_name}
                                                    </Typography>
                                                    {" — Updated " + formatDate(project.updated_at)}
                                                </>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            </div>
                        ))}
                        {tab === 0 && data?.projects.length === 0 && (
                            <Box p={3} textAlign="center">
                                <Typography color="text.secondary">No recent projects</Typography>
                            </Box>
                        )}

                        {tab === 1 && data?.users.map((user, index) => (
                            <div key={user.uuid}>
                                {index > 0 && <Divider component="li" />}
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => navigate(`/admin/admin-users/${user.uuid}`)}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'info.main' }}>
                                                <Person />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={user.full_name || user.email}
                                            secondary={"Joined " + formatDate(user.created_at)}
                                        />
                                        {!user.is_active && (
                                            <Chip label="Inactive" size="small" variant="outlined" />
                                        )}
                                    </ListItemButton>
                                </ListItem>
                            </div>
                        ))}
                        {tab === 1 && data?.users.length === 0 && (
                            <Box p={3} textAlign="center">
                                <Typography color="text.secondary">No recent users</Typography>
                            </Box>
                        )}
                    </List>
                )}
            </CardContent>
        </Card>
    );
}
