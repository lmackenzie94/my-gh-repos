import * as fs from 'node:fs';
import * as path from 'node:path';

const dataDir = path.join(process.cwd(), 'src/data');
const reposFile = path.join(dataDir, 'repos.json');

if (!fs.existsSync(reposFile)) {
  console.log('🚨 No repo data found! Fetching fresh data...');
  try {
    await import('./fetch-repos.js');
  } catch (error) {
    console.error('Error importing fetch-repos script:', error);
    process.exit(1);
  }
} else {
  console.log('✅ Repo data found!');
}
