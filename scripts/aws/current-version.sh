#!/bin/bash
# Returns the current deployed version from k8s manifests

# Get version from frontend.yaml (assuming both frontend and backend use same version)
VERSION=$(grep -oE ':v[0-9]+' k8s/frontend.yaml | head -n 1 | tr -d ':')

if [ -z "$VERSION" ]; then
    echo "❌ Could not detect version from k8s/frontend.yaml"
    exit 1
fi

echo "$VERSION"
