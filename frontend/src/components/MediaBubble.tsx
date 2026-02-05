
import React, { useState } from 'react';
import { Box, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE } from '../config/api';

// Reusing the interface from Chat.tsx, but exporting it here implies we might want to centralize types later
// For now, defining it locally to match usage
export interface AncillaryMedia {
    type: 'photo' | 'image' | 'video' | 'youtube';
    url: string;
    description?: string;
    keywords?: string[];
}

interface MediaBubbleProps {
    media: AncillaryMedia;
}

const MediaBubble: React.FC<MediaBubbleProps> = ({ media }) => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Helper to get full URL
    const getUrl = (url: string) => {
        if (url.startsWith('http') || url.startsWith('//')) return url;
        return `${API_BASE}${url}`;
    };

    if (media.type === 'video' || media.type === 'youtube') {
        const isYoutube = media.url.includes('youtube.com') || media.url.includes('youtu.be');

        // Videos are rendered generally at full width of the bubble container (which is already constrained)
        // or we can apply the 50% rule too. The requirement said "image". 
        // Videos don't usually act as thumbnails for modals unless we use a poster.
        // For now, I'll keep video as is (embedded), unless user asked for video modals too.
        // Request said: "When Media in included... the image should shown in a smaller thumbnail"
        // So I will only apply thumbnail/modal logic to images.

        if (isYoutube) {
            return (
                <Box
                    component="iframe"
                    src={media.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    sx={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 1, mt: 0.5 }}
                    allowFullScreen
                />
            );
        } else {
            return (
                <Box component="video" src={getUrl(media.url)} controls sx={{ maxWidth: '100%', borderRadius: 1, mt: 0.5 }} />
            );
        }
    }

    // Image Handling
    const imageUrl = getUrl(media.url);

    return (
        <>
            <Box
                component="img"
                src={imageUrl}
                alt={media.description || 'Media'}
                onClick={handleOpen}
                sx={{
                    maxWidth: '50%', // Thumbnail size
                    borderRadius: 1,
                    mt: 0.5,
                    cursor: 'zoom-in',
                    transition: 'opacity 0.2s',
                    '&:hover': {
                        opacity: 0.9
                    }
                }}
            />

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="xl" // Allow very wide images
                PaperProps={{
                    sx: {
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'hidden'
                    }
                }}
            >
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconButton
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <Box
                        component="img"
                        src={imageUrl}
                        alt={media.description}
                        sx={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            borderRadius: 1,
                            objectFit: 'contain'
                        }}
                    />
                </Box>
            </Dialog>
        </>
    );
};

export default MediaBubble;
