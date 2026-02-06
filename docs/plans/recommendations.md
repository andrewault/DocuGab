# Webapp Recommendations

This document outlines recommendations for improving the DocuGab web application, covering infrastructure, performance, and best practices.

## 1. Storage & Media Optimization

### S3 Access Control
-   **Current State**: We rely on standard access.
-   **Recommendation**: Use **Public Read** access via Bucket Policies for `docutok-logos` and `docutok-avatars`. This allows assets to be cached by CDNs and browsers, reducing load on the backend (generation of presigned URLs) and improving page load times.
-   **Action**: Apply the JSON bucket policy provided in `aws-deploy/logos-bucket-policy.json`.

### Image Optimization
-   **Current State**: Images (logos, avatars) are stored as-is.
-   **Recommendation**: Implement server-side image optimization (resizing, compression) before saving to S3.
    -   Use `Pillow` to convert non-optimized PNGs/JPEGs to WebP.
    -   Resize distinct thumbnails for list views vs detail views.
    -   Validate dimensions to prevent massive files from breaking layouts.

### User Content Caching
-   **Current State**: Files are mutable (names based on UUID).
-   **Recommendation**: Serve S3 objects with aggressive `Cache-Control` headers (e.g., `max-age=31536000`).
    -   To handle updates (e.g., changing a logo), append a version query parameter (`?v={timestamp}`) in the frontend `src`.

## 2. Infrastructure & Costs

### Kubernetes Node Scaling
-   **Current State**: Two `t3.medium` EC2 instances (Standard Workers).
-   **Recommendation**: For development or low-traffic staging environments, scale down to **1 node**.
    -   Command: `eksctl scale nodegroup --cluster=docutok-cluster --name=standard-workers --nodes=1`
    -   **Benefit**: Reduces AWS EC2 costs by ~50%.
    -   **Trade-off**: Reduced high availability during updates or node failures.

### Database Connection Pooling
-   **Current State**: `AsyncSessionLocal` is used per request.
-   **Recommendation**: Ensure `pgbouncer` is used in production (especially if running on Kubernetes) to manage connections efficiently, preventing "too many clients" errors during traffic spikes.

## 3. API & Backend

### Centralized Tag Management
-   **Current State**: Tags were scattered and inconsistent.
-   **Recommendation**: Enforce a "Single Source of Truth" for API tags in `app/api/v1/__init__.py`. Avoid defining `tags=["..."]` in individual routers unless they are truly isolated sub-modules.

### Rate Limiting
-   **Current State**: Basic limits configured.
-   **Recommendation**: Implement varying rate limits for "expensive" endpoints (e.g., file uploads, LLM generation) vs "cheap" endpoints (e.g., health checks, getting current user) to protect resources without hindering UX.
