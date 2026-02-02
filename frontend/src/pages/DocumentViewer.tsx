import { useParams, useNavigate } from 'react-router-dom';
import FileViewer from '../components/FileViewer';

export default function DocumentViewer() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();

    if (!uuid) return null;

    return (
        <FileViewer
            uuid={uuid}
            onBack={() => navigate('/documents')}
        />
    );
}
