import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const front = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = resolve(process.argv[2] || '');
if (!process.argv[2] || !existsSync(resolve(backend, 'LABOFMUNTANTAPI.csproj'))) {
  throw new Error('Indica la carpeta de LABOFMUNTANTAPI: npm run preparar:entrega -- "C:/ruta/LABOFMUNTANTAPI"');
}
execFileSync(process.execPath, [resolve(front, 'node_modules/vite/bin/vite.js'), 'build'], { cwd: front, stdio: 'inherit' });
const target = resolve(backend, 'wwwroot');
mkdirSync(target, { recursive: true });
cpSync(resolve(front, 'dist'), target, { recursive: true });
console.log('Front compilado y copiado a wwwroot. Publica la API con dotnet publish -c Release. Configura SQL Server y HTTPS en el alojamiento.');
