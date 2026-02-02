from app.services import chunking


def test_chunk_text():
    """Test chunking logic."""
    pages = [
        {"page": 1, "content": "This is page 1 content. " * 50},
        {"page": 2, "content": "Page 2 content."},
    ]

    chunks = chunking.chunk_text(pages)

    assert len(chunks) > 0
    assert chunks[0]["page"] == 1
    assert chunks[0]["chunk_index"] == 0

    # Check proper indexing
    indices = [c["chunk_index"] for c in chunks]
    assert indices == list(range(len(chunks)))

    # Check content exists
    assert all(c["content"] for c in chunks)
