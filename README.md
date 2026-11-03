# Alchemy Social

## Requirements

To start working with this Social, ensure the following tools are installed:

- [Node.js](https://nodejs.org/en/download/) (v22 or higher) - the JavaScript runtime used in this project.
- [pnpm](https://pnpm.io/installation) - the package manager used throughout this repository.
- [Postgres App](https://postgresapp.com/) - the Postgres database used in development.

## Installation

This repository uses [pnpm workspaces](https://pnpm.io/workspaces) to manage multiple packages within a monorepo structure.
Simply install using npm: `npm install -g pnpm`

### Clone the Repository

```bash
git clone https://github.com/Alchemy/social.git
```

### Install NVM and pnpm

On macOS, you can install both with Homebrew:

```bash
brew install nvm pnpm
```

### Install Node.js

Use `nvm` to install the required Node.js version:

```bash
nvm install
```

### Install Dependencies

From the repository root, install dependencies with pnpm:

```bash
pnpm install
```

### Set up Environment Variables

Copy the `.env.example` file to `.env` for each package or application that requires configuration:

```bash
cp .env.example .env
```

Repeat this process for all relevant packages and applications in the monorepo.

### Environment Variables

The example environment files define the following variables:

#### API (`apps/api/.env.example`)

- `PRIVATE_KEY` - Private key used to sign Lens requests.
- `SHARED_SECRET` - Token for internal API authorization.

#### Admin demo page

`/adminuseronlyadminaccessible` authenticates through server-side API handlers
using demo credentials declared in `api/admin/runtime.ts`. The demo records
visitor IP addresses and inferred operating systems in process memory, grouping
visits by IP and retaining up to the latest 1,000 visits. Admin-only wallet and
password-manager labels are also held in memory per IP. Records and labels can
be lost when a development or serverless process restarts and are not shared
reliably between instances. The normal app checks the matching IP's wallet
preference and shows a site-owned address reminder when navigating outside Home,
Profile, and Settings; this behavior is not reliable across Vercel serverless
instances.

### Start the Development Server

To run the application in development mode:

```bash
pnpm dev
```

## Build

### Build the application

Compile the application:

```bash
pnpm build
```

### Type-check the project

Validate the codebase with the TypeScript type checker:

```bash
pnpm typecheck
```

### Lint and Format Code

Check code quality and formatting with Biome:

```bash
pnpm biome:check
```

Automatically fix linting and formatting issues:

```bash
pnpm biome:fix
```

### Maintenance Scripts

Convenient Node.js helpers are in the `script` directory:

- `node script/clean.mjs` removes all `node_modules`, `.next` directories,
  `pnpm-lock.yaml`, and `tsconfig.tsbuildinfo` files.
- `node script/update-dependencies.mjs` updates packages across the monorepo,
  removes old installs and commits the changes in a new branch.
- `node script/sort-package-json.mjs` sorts all `package.json` files in the
  repository.

## License

This project is released under the **GNU AGPL-3.0** license. See the [LICENSE](./LICENSE) file for details

🌸
