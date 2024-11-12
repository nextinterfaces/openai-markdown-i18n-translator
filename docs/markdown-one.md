---
id: some-markdown-id
title: Introduction Markdown
description: Introduction Markdown Description
sidebar_label: Introduction Markdown
sidebar_position: 2
---

# Nextjs Nextra Static Site Generator - Documentation Portal

This repository is a fork of the Botpress documentation [source](https://github.com/botpress/documentation), optimized for managing and building a documentation portal using Next.js and Nextra.

## Development Setup

To get started with local development:

### Prerequisites

- **Node.js**: [Node.js](https://nodejs.org/en/) runtime.
- **pnpm**: [pnpm](https://pnpm.io/) package manager.
- **Tilt**: [Tilt](https://tilt.dev/) for automating multi-service workflows, it fixes the pains of microservice dev.
- **Docker**: [Docker](https://www.docker.com/) for containerized services.


## Using Tilt for Multi-Service Development

The `Tiltfile` in this project enables Tilt to manage the setup and teardown of services, streamlining development in a containerized or microservice environment.

### Running with Tilt

1. Install prerequisites 
2. Start Tilt and bring up all related services:

```bash
tilt up
```

This command will read the `Tiltfile` and start the services configured within it. Tilt’s web UI, accessible at `http://localhost:10350`, allows you to monitor logs, service statuses, and resource allocations in real time.

3. Open [http://localhost:3000/docs](http://localhost:3000/docs) with your browser, and you should see the local instance of documentation running.
### Stopping Tilt

To stop all services managed by Tilt:

```bash
tilt down
```

This halts any active Tilt processes and stops all managed containers.


## Using PNPM directly Instead of Tilt

### Installation

Install the project dependencies:

```bash
pnpm install
```

## Running the Development Server

To start the development server locally:

```bash
pnpm dev
```

This will launch the site at `http://localhost:3000`.

## Building and Serving for Production

To build the site for production:

```bash
pnpm build
```

Once built, you can serve the production build with:

```bash
pnpm start
```

## GitHub Actions Integration

This project includes workflows for CI/CD, automating linting, testing, and deployment. Below is an example of a GitHub Actions workflow file (`.github/workflows/ci.yml`) configured for this repository.

### Sample Workflow Configuration

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Build project
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v2
        with:
          name: build
          path: .next/
```

This workflow performs the following tasks:
- **Checkout**: Checks out the repository.
- **Node.js Setup**: Installs the specified Node.js version.
- **Install Dependencies**: Installs project dependencies using `pnpm`.
- **Test**: Runs tests (assuming a `pnpm test` command is configured).
- **Build**: Builds the project for production.
- **Upload Artifacts**: Uploads build artifacts for later steps or manual inspection.

## Additional Commands

### Linting and Formatting

To check code formatting and standards:

```bash
pnpm lint
```

To apply formatting automatically:

```bash
pnpm format
```

---

## Architecture Overview

This project is structured to support a highly modular and scalable documentation portal. The key components are organized as follows:

### Key Directories and Files

- **`pages/`**: Contains the main content pages, utilizing Next.js’ file-based routing. Each `.mdx` or `.tsx` file within this folder corresponds to a route in the documentation site.
- **`components/`**: Contains reusable components, such as layout wrappers and UI elements, used across multiple documentation pages.
- **`utils/`**: Houses helper functions and utilities that support various components and data handling throughout the project.
- **`public/`**: Stores static assets such as images and icons, which are directly served by the Next.js server.
- **`scripts/`**: Holds automation scripts for setup, deployment, or other maintenance tasks.
- **`Tiltfile`**: Contains the configuration for Tilt, a tool that helps automate development workflows, especially useful in multi-service setups and microservices.
- **`.github/workflows/`**: Houses GitHub Actions workflows for CI/CD, automating testing, build, and deployment tasks.
- **`package.json`**: Defines project dependencies and scripts managed through `pnpm`.

### Configuration Files

- **`next.config.mjs`**: Configures Next.js settings, including custom webpack configurations, redirects, and rewrites.
- **`tailwind.config.js`**: Configures Tailwind CSS for custom styling, allowing design consistency across documentation.
- **`tsconfig.json`**: TypeScript configuration that specifies compiler options and path aliases.
- **`postcss.config.js`**: Configures PostCSS to apply Tailwind CSS styles and other plugins.
- **`environment.d.ts`**: TypeScript definitions for environmental variables, ensuring type safety in configuration.

### About Nextra and Next.js

This projects is based on [Nextra](https://nextra.site/) which is built on top of [Next.js](https://nextjs.org/). Although knowledge of these is not a prerequisite for contributing, here are some links to quickly get you started on some concepts used in this project:

1. [Nextra Markdown Guide](https://nextra.site/docs/guide/markdown)
2. [Nextra Page Configuration](https://nextra.site/docs/docs-theme/page-configuration)
3. [Next.js Routing](https://nextjs.org/docs/pages/building-your-application/routing)
