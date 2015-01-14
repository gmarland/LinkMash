var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
    id: ObjectId,
    email: {type: String, default: ''},
    password: {type: String, default: ''},
    joined: { type: Date, default: Date.now },
	sessionId: {type: String, default: '' },
	facebookEnabled: {type: Boolean, default: false },
	twitterEnabled: {type: Boolean, default: false },
    facebookToken: {type: String, default: '' },
    twitterToken: {type: String, default: '' },
    twitterTokenSecret: {type: String, default: '' },
    lastFacebookMash: { type: Date },
    lastTwitterMash: { type: String }
});

module.exports = mongoose.model('User', UserSchema);