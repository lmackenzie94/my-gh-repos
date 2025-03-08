import * as fs from 'node:fs';
import * as path from 'node:path';

const dataDir = path.join(process.cwd(), 'src/data');
const reposFile = path.join(dataDir, 'repos.json');
const languagesFile = path.join(dataDir, 'languages.json');

if (!fs.existsSync(reposFile) || !fs.existsSync(languagesFile)) {
  console.log('🚨 Data files missing! Fetching fresh data...');
  try {
    await import('./fetch-repos.js');
  } catch (error) {
    console.error('Error importing fetch-repos script:', error);
    process.exit(1);
  }
} else {
  console.log('✅ Data files found!');
}
