import { Paper, Typography, Box, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface StatCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    sx?: SxProps<Theme>;
}

/**
 * StatCard - Display key metrics and statistics
 * Used in dashboards and overview pages
 */
export function StatCard({ label, value, icon, trend, color = 'primary', sx }: StatCardProps) {
    const colorMap = {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative',
                overflow: 'hidden',
                ...sx
            }}
        >
            {/* Icon background */}
            {icon && (
                <Box
                    sx={{
                        position: 'absolute',
                        right: -10,
                        top: -10,
                        opacity: 0.1,
                        fontSize: 80,
                        color: colorMap[color],
                    }}
                >
                    {icon}
                </Box>
            )}

            {/* Content */}
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {label}
                </Typography>

                <Typography variant="h4" fontWeight={700} color={colorMap[color]}>
                    {value}
                </Typography>

                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        {trend.isPositive ? (
                            <TrendingUp fontSize="small" color="success" />
                        ) : (
                            <TrendingDown fontSize="small" color="error" />
                        )}
                        <Typography
                            variant="body2"
                            color={trend.isPositive ? 'success.main' : 'error.main'}
                        >
                            {Math.abs(trend.value)}%
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
