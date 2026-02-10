import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, Stack, Divider } from '@mui/material';
import { Folder, Business, CalendarToday, Description } from '@mui/icons-material';
import { InfoSection } from '../../components/admin/InfoSection';
import { DetailRow } from '../../components/admin/DetailRow';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import type { Project } from '../../types/project';

interface ProjectOverviewProps {
    project: Project;
    currentUser: { timezone?: string } | null;
}

export function ProjectOverview({ project, currentUser }: ProjectOverviewProps) {
    const navigate = useNavigate();

    return (
        <>
            <InfoSection title="Basic Info" icon={<Folder />}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                    <Box sx={{ flex: 1 }}>
                        <Stack spacing={2}>
                            <DetailRow
                                icon={<Folder fontSize="small" />}
                                label="Chatbot Project Name"
                                value={project.name}
                                valueProps={{ fontWeight: 500 }}
                            />
                            <DetailRow
                                icon={<Business fontSize="small" />}
                                label="Customer"
                                value={
                                    <Typography
                                        variant="body1"
                                        sx={{ cursor: 'pointer', color: 'primary.main' }}
                                        onClick={() => project.customer_uuid && navigate(`/admin/customers/${project.customer_uuid}`)}
                                    >
                                        {project.customer_name}
                                    </Typography>
                                }
                            />
                            <DetailRow
                                label="Slug"
                                value={project.slug}
                                valueProps={{ fontFamily: 'monospace' }}
                            />
                        </Stack>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Stack spacing={2}>
                            <DetailRow
                                label="Status"
                                value={
                                    <Box>
                                        <Chip
                                            label={project.is_enabled ? 'Active' : 'Disabled'}
                                            size="small"
                                            sx={{
                                                backgroundColor: project.is_enabled ? '#4caf50' : '#f44336',
                                                color: 'white',
                                                fontWeight: 600
                                            }}
                                        />
                                        {project.is_demo && (
                                            <Chip
                                                label="Demo"
                                                size="small"
                                                sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 600, ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                }
                            />
                            <DetailRow
                                icon={<CalendarToday fontSize="small" />}
                                label="Created"
                                value={formatInUserTimezone(
                                    project.created_at,
                                    currentUser?.timezone || 'America/Los_Angeles',
                                    'PP'
                                )}
                            />
                            <DetailRow
                                icon={<Description fontSize="small" />}
                                label="Documents"
                                value={project.documents_count}
                                valueProps={{ fontWeight: 500 }}
                            />
                        </Stack>
                    </Box>
                </Stack>
            </InfoSection>

            {project.description && (
                <>
                    <Divider sx={{ my: 3 }} />
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Description
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            {project.description}
                        </Typography>
                    </Box>
                </>
            )}
        </>
    );
}
