module.exports = {

  async up(db){

    await db.collection('followings').updateMany({ active: { $exists: false } }, { $set: { active: true } });

  },

  async down(db){

    await db.collection('followings').updateMany({ active: { $exists: true } }, { $unset: { active: null } });

  }

};
