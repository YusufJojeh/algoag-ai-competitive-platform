import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const serverStatePath = path.join(tmpdir(), 'algoag-playwright-servers.json');

type ServerState = Array<{
    name: string;
    pid?: number;
}>;

function killProcessTree(pid: number) {
    if (process.platform === 'win32') {
        execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
        return;
    }

    try {
        process.kill(-pid, 'SIGTERM');
    } catch {
        process.kill(pid, 'SIGTERM');
    }
}

async function globalTeardown() {
    if (!existsSync(serverStatePath)) {
        return;
    }

    const servers = JSON.parse(readFileSync(serverStatePath, 'utf8')) as ServerState;

    for (const server of servers) {
        if (!server.pid) {
            continue;
        }

        try {
            killProcessTree(server.pid);
        } catch {
            // The process may already be gone if setup failed or the OS reaped it.
        }
    }

    rmSync(serverStatePath, { force: true });
}

export default globalTeardown;
