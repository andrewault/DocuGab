import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Stack,
    Chip,
} from '@mui/material';
import { Add, Delete, Edit, Image as ImageIcon, YouTube as YouTubeIcon } from '@mui/icons-material';
import { ancillaryApi } from '../../api/ancillary';
import type { ProjectMedia } from '../../api/ancillary';
import type { Project } from '../../types/project';

interface ProjectMediaManagerProps {
    project: Project;
}

export function ProjectMediaManager({ project }: ProjectMediaManagerProps) {
    const navigate = useNavigate();
    const [mediaItems, setMediaItems] = useState<ProjectMedia[]>([]);

    const fetchMedia = useCallback(async () => {
        try {
            const data = await ancillaryApi.getMedia(project.uuid);
            setMediaItems(data);
        } catch (err) {
            console.error('Failed to fetch media:', err);
        }
    }, [project.uuid]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleDelete = async (uuid: string) => {
        if (!confirm('Are you sure you want to delete this media item?')) return;
        try {
            await ancillaryApi.deleteMedia(project.uuid, uuid);
            fetchMedia();
        } catch (err) {
            console.error('Failed to delete media:', err);
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Ancillary Media</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate(`/admin/projects/${project.uuid}/media/new`)}
                >
                    Add Media
                </Button>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Preview</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Keywords</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mediaItems.map((item) => (
                            <TableRow
                                key={item.uuid}
                                hover
                                onClick={() => navigate(`/admin/projects/${project.uuid}/media/${item.uuid}`)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>
                                    {item.type === 'photo' ? <ImageIcon color="primary" /> : <YouTubeIcon color="error" />}
                                </TableCell>
                                <TableCell>
                                    {item.type === 'photo' ? (
                                        <Box component="img" src={item.url.startsWith('/') ? `${API_BASE}${item.url}` : item.url} sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">{item.url}</Typography>
                                    )}
                                </TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                        {item.keywords.map((kw) => (
                                            <Chip key={kw} label={kw} size="small" />
                                        ))}
                                    </Stack>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/admin/projects/${project.uuid}/media/${item.uuid}/edit`);
                                        }}
                                        color="primary"
                                        sx={{ mr: 1 }}
                                        title="Edit"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.uuid);
                                        }}
                                        color="error"
                                        title="Delete"
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {mediaItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography color="text.secondary" py={4}>
                                        No media items found. Add one to show visual content in chat responses.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
