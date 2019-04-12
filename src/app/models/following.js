const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const followingSchema = new Schema({
  socialId: { type: String, required: true, unique: true, dropDups: true },
  username: { type: String, required: true },
}, { timestamps: true });

followingSchema.statics.isPresent = async function({ socialId }){

  const following = await this.findOne({ socialId });

  return Boolean(following);

};

followingSchema.statics.findOlds = async function(timer){

  return this.find({
    createdAt: {
      $lte: timer.toDate()
    }
  });

};

module.exports = mongoose.model('Following', followingSchema);
