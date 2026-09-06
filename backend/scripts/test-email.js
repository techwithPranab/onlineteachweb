#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sendEmail } = require('../utils/emailService');

const args = process.argv.slice(2);
const toArgument = args.find(argument => argument.startsWith('--to='));
const recipient = toArgument?.slice('--to='.length);

const main = async () => {
  if (args.includes('--help') || !recipient) {
    console.log(`
Send a test email through the configured email provider.

Usage:
  node backend/scripts/test-email.js --to=you@example.com
  cd backend && npm run email:test -- --to=you@example.com
`);
    if (!args.includes('--help')) process.exitCode = 1;
    return;
  }

  const result = await sendEmail({
    to: recipient,
    subject: 'MeritAI email integration test',
    text: 'Your MeritAI email integration is configured correctly.',
    html: '<h1>MeritAI email test</h1><p>Your email integration is configured correctly.</p>',
    tags: { purpose: 'integration_test' }
  });

  console.log(`Email accepted by ${result.provider}.`);
  console.log(`Message ID: ${result.messageId || 'not returned'}`);
  console.log(`Status: ${result.status || 'accepted'}`);
};

main().catch(error => {
  console.error(`Email test failed: ${error.message}`);
  process.exitCode = 1;
});

