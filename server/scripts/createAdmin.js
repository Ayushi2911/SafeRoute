const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

if (process.env.NODE_ENV !== 'development') {
  console.error('Refusing to create an admin unless NODE_ENV=development.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const askPassword = (question) => new Promise((resolve) => {
  process.stdout.write(question);
  const input = process.stdin;
  let password = '';

  input.setRawMode(true);
  input.resume();
  input.on('data', (chunk) => {
    const character = chunk.toString();
    if (character === '\u0003') {
      input.setRawMode(false);
      input.pause();
      process.exit(130);
    }
    if (character === '\r' || character === '\n') {
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      resolve(password);
      return;
    }
    if (character === '\u0008' || character === '\u007f') {
      password = password.slice(0, -1);
      return;
    }
    password += character;
  });
});

async function createAdmin() {
  const name = (await ask('Admin name: ')).trim();
  const email = (await ask('Admin email: ')).trim().toLowerCase();
  rl.close();
  const password = await askPassword('Admin password: ');

  if (!name || !email || password.length < 6) {
    throw new Error('Name and email are required; password must be at least 6 characters.');
  }

  const [existingUsers] = await db.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existingUsers.length > 0) {
    await db.query(
      'UPDATE users SET name = ?, password = ?, role = ? WHERE email = ?',
      [name, await bcrypt.hash(password, 10), 'admin', email]
    );
    console.log(`Updated existing account ${email} with the admin role.`);
    return;
  }

  const [result] = await db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, await bcrypt.hash(password, 10), 'admin']
  );
  await db.query('INSERT INTO user_profiles (user_id) VALUES (?)', [result.insertId]);
  console.log(`Created development admin account ${email}.`);
}

createAdmin()
  .catch((error) => {
    console.error(`Could not create development admin: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
    db.end();
  });
