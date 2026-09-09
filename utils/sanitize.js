// Strips credential hashes before an Account row goes into a JSON response.
// passwordHash is usually null for DRIVER accounts so this went unnoticed,
// but pinHash is a real, crackable bcrypt hash of a 4-6 digit PIN (~10k
// combinations) the moment a driver sets one — it must never leave the API.
const sanitizeAccount = (account) => {
  if (!account) return account;

  const { passwordHash, pinHash, ...safe } = account;

  return safe;
};

module.exports = { sanitizeAccount };
