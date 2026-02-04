-- Reset vector store for model migration
-- Truncate chunks table to remove incompatible embeddings
TRUNCATE TABLE chunks CASCADE;

-- Reset document status to 'pending' to trigger reprocessing
UPDATE documents 
SET status = 'pending', 
    error_message = NULL;

-- Log the operation
DO $$
BEGIN
    RAISE NOTICE 'Vector database reset complete. All documents set to pending re-indexing.';
END $$;
