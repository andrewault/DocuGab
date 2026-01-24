import { Breadcrumbs, Link, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface AdminBreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
    return (
        <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 3 }}
        >
            <Link
                component={RouterLink}
                to="/admin"
                color="text.secondary"
                underline="hover"
            >
                Admin
            </Link>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return isLast ? (
                    <Typography key={item.label} color="text.primary">
                        {item.label}
                    </Typography>
                ) : (
                    <Link
                        key={item.label}
                        component={RouterLink}
                        to={item.path || '#'}
                        color="text.secondary"
                        underline="hover"
                    >
                        {item.label}
                    </Link>
                );
            })}
        </Breadcrumbs>
    );
}
