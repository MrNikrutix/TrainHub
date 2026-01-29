import fs from 'fs';
import path from 'path';

console.log("Checking project health...");

// 1. Check for valid package.json
if (!fs.existsSync('package.json')) {
    console.error("❌ package.json not found!");
    process.exit(1);
}

// 2. Check source directory structure
const requiredDirs = [
    'src/app',
    'src/app/services',
    'src/app/components',
    'src/app/pages',
    'src/app/config.ts'
];

let allDirsExist = true;
requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.error(`❌ Missing directory: ${dir}`);
        allDirsExist = false;
    }
});

if (!allDirsExist) {
    process.exit(1);
}

console.log("✅ Project structure looks correct.");
console.log("✅ Health check passed!");
