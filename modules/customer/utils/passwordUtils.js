const bcrypt = require('bcryptjs');

const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

module.exports = { verifyPassword, hashPassword };