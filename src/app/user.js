const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  instagramId: { type: String, required: true, unique: true, dropDups: true },
  username: { type: String, required: true },
  status: { type: String, required: true, enum: [ 'pending', 'uploaded' ], default: 'pending' },
}, { timestamps: true });

userSchema.statics.isPresent = async function({ instagramId }){

  const user = await this.findOne({ instagramId });

  return Boolean(user);

};

module.exports = mongoose.model('User', userSchema);
