const bcrypt = require("bcrypt");
const {
  UserSecurityData,
  UserBasicData,
  GeneralUserStats,
  User,
} = require("../../../../src/models");
const {
  generateToken,
  generateRefreshToken,
  saveTokens,
} = require("../../../services/auth");
async function createUser(
  username,
  password,
  email,
  role_data,
  firstName,
  lastName
) {
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

  await Promise.all([
    newUserSecurityData.save(),
    newUserBasicData.save(),
    newUser.save(),
  ]);
  return { newUser };
}
async function createUserValidationData(user) {
  const accessToken = await generateToken(user._id);
  const refreshToken = await generateRefreshToken(user._id);

  const { savedAccessToken, savedRefreshToken } = await saveTokens(
    user._id,
    accessToken,
    refreshToken
  );

  const verifiedUser = await User.findById(user._id)
    .populate("userSecurityData")
    .populate("userBasicData");

  verifiedUser.userSecurityData.accessToken = savedAccessToken;
  verifiedUser.userSecurityData.refreshToken = savedRefreshToken;
  await verifiedUser.save();

  return verifiedUser;
}
module.exports = {
  createUser,
  createUserValidationData,
};