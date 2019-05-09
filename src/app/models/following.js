const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const followingSchema = new Schema({
  socialId: { type: String, required: true, unique: true, dropDups: true },
  username: { type: String, required: true },
  active: { type: Boolean, required: true, default: true },
  fromTag: { type: String, required: true },
}, { timestamps: true });

class Following {

  async reload(){

    Object.assign(this, await this.constructor.findOne({ _id: this.id }) );

  }

  static async isPresent({ socialId }){

    const following = await this.findOne({ socialId });

    return Boolean(following);

  }

  static async findOlds(timer){

    return this.find({
      createdAt: {
        $lte: timer.toDate()
      },
      active: true
    }).sort({ 'createdAt': 'asc' });

  }

}

followingSchema.loadClass(Following);

module.exports = mongoose.model('Following', followingSchema);
