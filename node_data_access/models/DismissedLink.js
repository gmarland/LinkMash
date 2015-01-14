var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var dismissedLinkSchema = new Schema({
    id: ObjectId,
	owner: { type: ObjectId, ref: 'User' },
    source: { type: String },
	linkId: { type: String },
	ownerId: { type: String },
	ownerName: {type: String },
	message: { type: String },
	title: { type: String },
	summary: { type: String },
	url: { type: String },
	imageUrls: { type: String },
	date: {type: Date },
	dateDismissed: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DismissedLink', dismissedLinkSchema);