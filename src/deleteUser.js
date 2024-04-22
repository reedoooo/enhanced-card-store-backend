const { User } = require('./models/User');
const deleteUser = async (condition) => {
  try {
    const result = await User.deleteOne(condition); // Use deleteOne for single document, deleteMany for multiple
    console.log(`Deleted count: ${result.deletedCount}`); // Log the number of deleted documents
  } catch (error) {
    console.error('Error deleting user:', error); // Handle errors
  } finally {
    mongoose.disconnect(); // Always close the connection
  }
};

deleteUser({ 'login_data.username': 'specificUsername' }); // Change 'specificUsername' to the user you want to delete

module.exports = { deleteUser };