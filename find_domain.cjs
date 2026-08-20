const dns = require('dns');

const base = 'gwtjeusllzpuncvcmck';
const chars = 'abcdefghijklmnopqrstuvwxyz';

const permutations = new Set();
for (let i = 0; i <= base.length; i++) {
  for (let c of chars) {
    permutations.add(base.slice(0, i) + c + base.slice(i));
  }
}

// Also check the 'q' variant just in case
const baseQ = 'qwtjeusllzpuncvcmck';
for (let i = 0; i <= baseQ.length; i++) {
  for (let c of chars) {
    permutations.add(baseQ.slice(0, i) + c + baseQ.slice(i));
  }
}

console.log(`Checking ${permutations.size} possible domains...`);

let found = false;
let checked = 0;

const checkDomain = (domain) => {
  return new Promise((resolve) => {
    dns.resolve(domain, (err, addresses) => {
      checked++;
      if (!err && addresses.length > 0) {
        console.log(`\n✅ FOUND VALID DOMAIN: ${domain}`);
        found = true;
      }
      if (checked % 100 === 0) {
        process.stdout.write('.');
      }
      resolve();
    });
  });
};

const run = async () => {
  const promises = [];
  for (const perm of permutations) {
    const domain = `${perm}.supabase.co`;
    promises.push(checkDomain(domain));
    if (promises.length >= 50) {
      await Promise.all(promises);
      promises.length = 0;
    }
  }
  await Promise.all(promises);
  console.log('\nDone.');
};

run();
