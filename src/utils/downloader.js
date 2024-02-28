const download = require('image-downloader');
const path = require('path');
const fs = require('fs');

// Define your public directory path here
const publicDirectory = path.join(__dirname, 'public', 'images');

// Ensure the directory exists
if (!fs.existsSync(publicDirectory)) {
  fs.mkdirSync(publicDirectory, { recursive: true });
}

// Function to download and save image
async function downloadImage(imageUrl, imageName) {
  const options = {
    url: imageUrl,
    dest: path.join(publicDirectory, imageName), // Save to public/images directory
  };

  try {
    const { filename } = await download.image(options);
    console.log('Saved to', filename); // Saved to public/images/imageName
  } catch (error) {
    console.error('Failed to download image:', error);
  }
}

// Use the function
downloadImage('URL_OF_THE_IMAGE', 'desiredImageName.jpg');
