import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface CustomerBreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function CustomerBreadcrumbs({ items }: CustomerBreadcrumbsProps) {
    return (
        <Box mb={3}>
            <Breadcrumbs
                separator={<NavigateNext fontSize="small" />}
                aria-label="breadcrumb"
            >
                <Link
                    component={RouterLink}
                    to="/customer"
                    underline="hover"
                    color="inherit"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                    <Home fontSize="small" />
                    Dashboard
                </Link>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return isLast ? (
                        <Typography key={index} color="text.primary" fontWeight={600}>
                            {item.label}
                        </Typography>
                    ) : (
                        <Link
                            key={index}
                            component={RouterLink}
                            to={item.path || '#'}
                            underline="hover"
                            color="inherit"
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </Breadcrumbs>
        </Box>
    );
}
