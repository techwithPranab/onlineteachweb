const mongoose = require('mongoose');
const Material = require('../models/Material.model');
require('dotenv').config();

async function updateAllMaterialsToFree() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-teaching', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Update all materials to be free
    const result = await Material.updateMany(
      {}, // Empty filter to match all documents
      { $set: { isFree: true } }
    );

    console.log(`Updated ${result.modifiedCount} materials to be free`);

    // Get total count for verification
    const totalMaterials = await Material.countDocuments();
    const freeMaterials = await Material.countDocuments({ isFree: true });

    console.log(`Total materials: ${totalMaterials}`);
    console.log(`Free materials: ${freeMaterials}`);

    console.log('All materials have been updated to free!');

  } catch (error) {
    console.error('Error updating materials:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateAllMaterialsToFree();
