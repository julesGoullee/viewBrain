const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const followerSchema = new Schema({
  socialId: { type: String, required: true, unique: true, dropDups: true },
  username: { type: String, required: true },
  status: { type: String, required: true, enum: [ 'pending', 'uploaded' ], default: 'pending' },
}, { timestamps: true });

followerSchema.statics.isPresent = async function({ socialId }){

  const follower = await this.findOne({ socialId });

  return Boolean(follower);

};

module.exports = mongoose.model('Follower', followerSchema);
