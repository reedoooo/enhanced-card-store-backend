const bcrypt = require('bcrypt');
const { UserSecurityData, UserBasicData, User } = require('../../../models');
async function createUser(username, password, email, role_data, firstName, lastName) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUserSecurityData = new UserSecurityData({
    username,
    password: hashedPassword,
    email,
    role_data,
  });

  const newUserBasicData = new UserBasicData({ firstName, lastName });

  const newUser = new User({
    username,
    userSecurityData: newUserSecurityData._id,
    userBasicData: newUserBasicData._id,
  });

  await Promise.all([newUserSecurityData.save(), newUserBasicData.save(), newUser.save()]);

  return { newUser, newUserSecurityData, newUserBasicData };
}

module.exports = {
  createUser,
};
