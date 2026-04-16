const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  score: { type: Number, required: true },
  category: { type: String, required: true }, // e.g., "Coding", "Communication", "Aptitude"
  notes: String
});

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: Number, default: 0 }, // 0 to 100
});

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  skills: [skillSchema],
  performance: [performanceSchema],
  profileImage: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
