#!/usr/bin/env node
/**
 * PHASE 2 CHECK: Validates brand voice files are properly configured
 * Run this before generating scripts to make sure Eddie has what he needs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = {
  'writing-rules.md': { required: true, checkFor: ['Banned Words'] },
  'voice.md': { required: true, checkFor: ['YOUR DESCRIPTION HERE', 'YOUR PRODUCT'] },
  'product.md': { required: true, checkFor: ['YOUR PRODUCT NAME', '[Feature]'] },
  'icp.md': { required: true, checkFor: ['Name this persona'] },
};

function main() {
  console.log('🤖 EDDIE — Phase 2: Brand Voice Check');
  console.log('='.repeat(50));

  let allGood = true;

  for (const [file, config] of Object.entries(FILES)) {
    const fullPath = path.join(ROOT, 'brand-voice', file);

    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ${file} — MISSING`);
      allGood = false;
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const hasPlaceholders = config.checkFor.some(p => content.includes(p));

    if (hasPlaceholders && file !== 'writing-rules.md') {
      console.log(`⚠️  ${file} — has placeholder text that needs customization`);
      allGood = false;
    } else {
      const wordCount = content.split(/\s+/).length;
      console.log(`✅ ${file} — ${wordCount} words`);
    }
  }

  console.log('');
  if (allGood) {
    console.log('✅ Brand voice is configured! Ready for script generation.');
    console.log('\n👉 Next: npm run phase3:generate');
  } else {
    console.log('⚠️  Customize the files above in brand-voice/ before generating scripts.');
    console.log('   Each file has instructions and templates inside it.');
  }
}

main();
