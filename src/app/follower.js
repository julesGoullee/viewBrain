const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const followerSchema = new Schema({
  instagramId: { type: String, required: true, unique: true, dropDups: true },
  username: { type: String, required: true },
  status: { type: String, required: true, enum: [ 'pending', 'uploaded' ], default: 'pending' },
}, { timestamps: true });

followerSchema.statics.isPresent = async function({ instagramId }){

  const follower = await this.findOne({ instagramId });

  return Boolean(follower);

};

module.exports = mongoose.model('Follower', followerSchema);
