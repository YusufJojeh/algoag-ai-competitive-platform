import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverStatePath = path.join(tmpdir(), 'algoag-playwright-servers.json');
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

const serverEnv = {
    ...process.env,
    APP_ENV: 'local',
    APP_URL: 'http://127.0.0.1:8000',
    BROADCAST_CONNECTION: 'log',
    CACHE_STORE: 'file',
    CACHE_DRIVER: 'file',
    SESSION_DRIVER: 'file',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: 'database/database.sqlite',
    ENABLE_E2E_FIXTURES: 'true',
    E2E_FIXTURE_SECRET: process.env.E2E_FIXTURE_SECRET ?? 'phpunit-e2e-secret',
};

type ManagedServer = {
    name: string;
    command: string;
    args: string[];
    cwd: string;
    url: string;
    env?: NodeJS.ProcessEnv;
};

const servers: ManagedServer[] = [
    {
        name: 'vite',
        command: process.execPath,
        args: [path.join(projectRoot, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5174'],
        cwd: projectRoot,
        url: 'http://127.0.0.1:5174/@vite/client',
    },
    {
        name: 'laravel',
        command: 'php',
        args: ['-S', '127.0.0.1:8000', '..\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\resources\\server.php'],
        cwd: path.join(projectRoot, 'public'),
        url: 'http://127.0.0.1:8000',
        env: serverEnv,
    },
];

async function isReady(url: string) {
    try {
        const response = await fetch(url, { redirect: 'manual' });
        return response.status < 500;
    } catch {
        return false;
    }
}

async function waitForServer(url: string, timeoutMs = 120_000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        if (await isReady(url)) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Timed out waiting for ${url}`);
}

async function globalSetup() {
    const alreadyRunning = await Promise.all(servers.map((server) => isReady(server.url)));
    if (alreadyRunning.some(Boolean)) {
        throw new Error('Playwright E2E ports are already in use. Stop existing 127.0.0.1:8000/5174 servers before running the suite.');
    }

    const children = servers.map((server) => {
        const child = spawn(server.command, server.args, {
            cwd: server.cwd,
            env: server.env ?? process.env,
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
        });

        child.unref();

        return {
            name: server.name,
            pid: child.pid,
        };
    });

    try {
        await Promise.all(servers.map((server) => waitForServer(server.url)));
    } catch (error) {
        writeFileSync(serverStatePath, JSON.stringify(children, null, 2));
        throw error;
    }

    mkdirSync(path.dirname(serverStatePath), { recursive: true });
    writeFileSync(serverStatePath, JSON.stringify(children, null, 2));
}

export default globalSetup;
