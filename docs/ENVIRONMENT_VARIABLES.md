# Environment variables and deployment guide

This project uses Next.js. For any key with the `NEXT_PUBLIC_` prefix, the value is exposed to the browser bundle and is read during the Next.js build step, not only when the container starts.

## Rule of thumb

- `NEXT_PUBLIC_*` -> public browser config, usually set in `.env*`, Docker build args, and deployment environment variables.
- `*_SECRET`, `DATABASE_URL`, API tokens, private keys -> keep in secrets, never expose to the browser.
- `process.env.*` used in client code is evaluated at build time for static bundle generation.

## When adding a new `NEXT_PUBLIC_` key

Follow this checklist every time:

1. Add the key to `.env.example`.
2. Add it to the code where it is read, for example:
   `process.env.NEXT_PUBLIC_NEW_KEY`
3. If the app is built with Docker, add the corresponding `ARG` and `ENV` entries to the Dockerfile before `RUN pnpm build`.
4. If the app is started with Docker Compose, add the variable under `environment:` and, if needed, under `build.args:` for build-time injection.
5. If the project is deployed via GitHub Actions or GitHub Environments, add it as a GitHub Variable (or Secret if truly private).
6. Rebuild the image after the change.

## Example: Android install config

The following variables are public client values and must be available during build:

```env
NEXT_PUBLIC_ANDROID_APK_URL="https://example.com/app.apk"
NEXT_PUBLIC_ANDROID_APP_VERSION="1.2.3"
NEXT_PUBLIC_ANDROID_APK_SIZE="32 MB"
NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED="true"
NEXT_PUBLIC_ANDROID_RELEASE_NOTES="Fix login and performance issues"
```

In Dockerfile, the build-time config must be present before `RUN pnpm build`:

```dockerfile
ARG NEXT_PUBLIC_ANDROID_APK_URL
ARG NEXT_PUBLIC_ANDROID_APP_VERSION
ARG NEXT_PUBLIC_ANDROID_APK_SIZE
ARG NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED
ARG NEXT_PUBLIC_ANDROID_RELEASE_NOTES

ENV NEXT_PUBLIC_ANDROID_APK_URL=$NEXT_PUBLIC_ANDROID_APK_URL
ENV NEXT_PUBLIC_ANDROID_APP_VERSION=$NEXT_PUBLIC_ANDROID_APP_VERSION
ENV NEXT_PUBLIC_ANDROID_APK_SIZE=$NEXT_PUBLIC_ANDROID_APK_SIZE
ENV NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED=$NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED
ENV NEXT_PUBLIC_ANDROID_RELEASE_NOTES=$NEXT_PUBLIC_ANDROID_RELEASE_NOTES
```

In Docker Compose, use both layers when needed:

```yaml
build:
  args:
    NEXT_PUBLIC_ANDROID_APK_URL: ${NEXT_PUBLIC_ANDROID_APK_URL}
    NEXT_PUBLIC_ANDROID_APP_VERSION: ${NEXT_PUBLIC_ANDROID_APP_VERSION}
    NEXT_PUBLIC_ANDROID_APK_SIZE: ${NEXT_PUBLIC_ANDROID_APK_SIZE}
    NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED: ${NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED}
    NEXT_PUBLIC_ANDROID_RELEASE_NOTES: ${NEXT_PUBLIC_ANDROID_RELEASE_NOTES}

environment:
  NEXT_PUBLIC_ANDROID_APK_URL: ${NEXT_PUBLIC_ANDROID_APK_URL}
  NEXT_PUBLIC_ANDROID_APP_VERSION: ${NEXT_PUBLIC_ANDROID_APP_VERSION}
  NEXT_PUBLIC_ANDROID_APK_SIZE: ${NEXT_PUBLIC_ANDROID_APK_SIZE}
  NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED: ${NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED}
  NEXT_PUBLIC_ANDROID_RELEASE_NOTES: ${NEXT_PUBLIC_ANDROID_RELEASE_NOTES}
```

## GitHub deployment rule

Use GitHub Variables for public frontend keys. Use GitHub Secrets only for private values.

Example:

```yaml
env:
  NEXT_PUBLIC_ANDROID_APK_URL: ${{ vars.NEXT_PUBLIC_ANDROID_APK_URL }}
  NEXT_PUBLIC_ANDROID_APP_VERSION: ${{ vars.NEXT_PUBLIC_ANDROID_APP_VERSION }}
  NEXT_PUBLIC_ANDROID_APK_SIZE: ${{ vars.NEXT_PUBLIC_ANDROID_APK_SIZE }}
  NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED: ${{ vars.NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED }}
  NEXT_PUBLIC_ANDROID_RELEASE_NOTES: ${{ vars.NEXT_PUBLIC_ANDROID_RELEASE_NOTES }}
```

## Common mistake to avoid

Do not add only `environment:` in Docker Compose and expect a `NEXT_PUBLIC_*` value to appear in the browser bundle after the app is already built. For a Next.js client app, the value must be present while the image is being built.

## Summary

When adding a new frontend key:

- declare it in `.env.example`
- inject it for the Docker build
- inject it for runtime if needed
- configure it in GitHub Variables or Secrets
- rebuild the image

This keeps the app consistent across local development, Docker, and deployment environments.
