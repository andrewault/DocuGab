import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    CircularProgress,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

interface FAQItem {
    id: number;
    question: string;
    answer: string;
    order: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function FAQ() {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | false>(false);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/faq/`);
                if (res.ok) {
                    const data = await res.json();
                    setFaqs(data.faqs);
                }
            } catch (e) {
                console.error('Failed to fetch FAQs:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    const handleChange = (id: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? id : false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 8,
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            }}
        >
            <Container maxWidth="md">
                <Typography
                    variant="h2"
                    textAlign="center"
                    mb={2}
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Frequently Asked Questions
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center" mb={6}>
                    Find answers to common questions about DocuGab
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : faqs.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" textAlign="center" py={8}>
                        No FAQs available yet.
                    </Typography>
                ) : (
                    faqs.map((faq) => (
                        <Accordion
                            key={faq.id}
                            expanded={expanded === faq.id}
                            onChange={handleChange(faq.id)}
                            sx={{
                                mb: 2,
                                background: isDark
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                border: isDark
                                    ? '1px solid rgba(255, 255, 255, 0.1)'
                                    : '1px solid rgba(0, 0, 0, 0.08)',
                                borderRadius: '12px !important',
                                '&:before': { display: 'none' },
                                '&.Mui-expanded': {
                                    margin: '0 0 16px 0',
                                },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                sx={{
                                    '& .MuiAccordionSummary-content': {
                                        my: 2,
                                    },
                                }}
                            >
                                <Typography variant="h6" fontWeight={600}>
                                    {faq.question}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pb: 3 }}>
                                <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {faq.answer}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))
                )}
            </Container>
        </Box>
    );
}
