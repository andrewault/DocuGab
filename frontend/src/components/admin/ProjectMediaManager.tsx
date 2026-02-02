import { useState, useEffect } from 'react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stack,
    Chip,
    Alert,
} from '@mui/material';
import { Add, Delete, Image as ImageIcon, YouTube as YouTubeIcon } from '@mui/icons-material';
import { ancillaryApi } from '../../api/ancillary';
import type { ProjectMedia } from '../../api/ancillary';
import type { Project } from '../../types/project';

interface ProjectMediaManagerProps {
    project: Project;
}

export function ProjectMediaManager({ project }: ProjectMediaManagerProps) {
    const [mediaItems, setMediaItems] = useState<ProjectMedia[]>([]);
    const [openDiaog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [type, setType] = useState<'photo' | 'youtube'>('photo');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);

    const fetchMedia = async () => {
        try {
            const data = await ancillaryApi.getMedia(project.uuid);
            setMediaItems(data);
        } catch (err) {
            console.error('Failed to fetch media:', err);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, [project.uuid]);

    const handleAddKeyword = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && keywordInput.trim()) {
            e.preventDefault();
            if (!keywords.includes(keywordInput.trim())) {
                setKeywords([...keywords, keywordInput.trim()]);
            }
            setKeywordInput('');
        }
    };

    const handleDeleteKeyword = (kwToDelete: string) => {
        setKeywords(keywords.filter((kw) => kw !== kwToDelete));
    };

    const handleSubmit = async () => {
        if (!url || keywords.length === 0) {
            setError('URL and at least one keyword are required');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await ancillaryApi.createMedia(project.uuid, {
                type,
                url,
                description,
                keywords,
            });
            setOpenDialog(false);
            fetchMedia();
            // Reset form
            setUrl('');
            setDescription('');
            setKeywords([]);
            setType('photo');
        } catch (err) {
            setError('Failed to create media item');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this media item?')) return;
        try {
            await ancillaryApi.deleteMedia(project.uuid, id);
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
                    onClick={() => setOpenDialog(true)}
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
                            <TableRow key={item.id}>
                                <TableCell>
                                    {item.type === 'photo' ? <ImageIcon color="primary" /> : <YouTubeIcon color="error" />}
                                </TableCell>
                                <TableCell>
                                    {item.type === 'photo' ? (
                                        <Box component="img" src={item.url} sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }} />
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
                                    <IconButton onClick={() => handleDelete(item.id)} color="error">
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

            <Dialog open={openDiaog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Media Response</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} pt={1}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <TextField
                            select
                            label="Type"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                        >
                            <MenuItem value="photo">Photo (Image URL)</MenuItem>
                            <MenuItem value="youtube">YouTube (Video URL)</MenuItem>
                        </TextField>

                        <TextField
                            label="URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={type === 'photo' ? 'https://example.com/image.jpg' : 'https://youtube.com/watch?v=...'}
                            fullWidth
                        />

                        <TextField
                            label="Description / Caption"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={2}
                            fullWidth
                        />

                        <Box>
                            <Typography variant="caption" color="text.secondary" mb={1} display="block">
                                Keywords (Press Enter to add)
                            </Typography>
                            <TextField
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={handleAddKeyword}
                                placeholder="Add trigger keyword..."
                                fullWidth
                                size="small"
                            />
                            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                                {keywords.map((kw) => (
                                    <Chip
                                        key={kw}
                                        label={kw}
                                        onDelete={() => handleDeleteKeyword(kw)}
                                        size="small"
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
