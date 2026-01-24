import { Box, Container, Typography, Paper, useTheme } from '@mui/material';

export default function About() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 8,
                pb: 12,
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
                    About DocuGab
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center" mb={6}>
                    Your intelligent document assistant
                </Typography>

                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        background: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        border: isDark
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                >
                    <Typography variant="h5" fontWeight={600} mb={2}>
                        What is DocuGab?
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        DocuGab is a RAG (Retrieval-Augmented Generation) powered document intelligence
                        platform that lets you have natural conversations with your documents. Upload
                        PDFs, Word documents, text files, or Markdown, and start asking questions
                        in plain English.
                    </Typography>

                    <Typography variant="h5" fontWeight={600} mb={2} mt={4}>
                        Key Features
                    </Typography>
                    <Typography color="text.secondary" component="div">
                        <ul>
                            <li>Multi-format document support (PDF, DOCX, TXT, MD)</li>
                            <li>Natural language question answering</li>
                            <li>Source citations for every answer</li>
                            <li>100% local and private - your data stays on your machine</li>
                            <li>Powered by Ollama for local AI processing</li>
                        </ul>
                    </Typography>

                    <Typography variant="h5" fontWeight={600} mb={2} mt={4}>
                        Technology
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Built with FastAPI, React, PostgreSQL with pgvector, and Ollama for local
                        LLM inference. DocuGab uses advanced chunking and embedding strategies to
                        provide accurate, contextual answers from your documents.
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}
