const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function copyFile(source, dest, transform = null) {
  const content = fs.readFileSync(source, 'utf8');
  const transformedContent = transform ? transform(content) : content;
  fs.writeFileSync(dest, transformedContent);
  console.log(`Copied ${source} to ${dest}`);
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

if (fs.existsSync(path.join(rootDir, 'README.md'))) {
  copyFile(path.join(rootDir, 'README.md'), path.join(distDir, 'README.md'));
}

copyFile(
  path.join(rootDir, 'package.json'),
  path.join(distDir, 'package.json'),
  (content) => {
    const packageJson = JSON.parse(content);

    delete packageJson.scripts;
    delete packageJson.devDependencies;

    packageJson.main = 'index.js';
    packageJson.types = 'index.d.ts';

    return JSON.stringify(packageJson, null, 2);
  }
);

console.log(
  'Package preparation complete. To publish, run: cd dist && npm publish'
);
