import { useParams, useNavigate } from 'react-router-dom';
import FileViewer from '../../components/FileViewer';

export default function AdminDocumentViewer() {
    const { uuid, document_uuid } = useParams<{ uuid: string; document_uuid: string }>();
    const navigate = useNavigate();

    if (!document_uuid) return null;

    return (
        <FileViewer
            uuid={document_uuid}
            onBack={() => navigate(`/admin/projects/${uuid}/documents`)}
        />
    );
}
