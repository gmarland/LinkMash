var User = require(config.userModel);
var Link = require(config.linkModel);
var ReadLink = require(config.readLinkModel);
var DismissedLink = require(config.dismissedLinkModel);

exports.getLinks = function (req, res) {
	if (!req.isAuthenticated()) { 
		dataError.log({
			model: __filename,
			action: "getLinkFeed",
			msg: "Unauthorized access",
			res: res
		});
	}
	else {
		Link
		.find({ owner: req.user._id })
		.exec(function(err, links) {
			if (err) {
				dataError.log({
					model: __filename,
					action: "getAllLinks",
					msg: "Error retrieving links",
					err: err,
					res: res
				});
			}
			else {
				var returnLinks = [];

				links.sort(function (a, b) { return (new Date(a.date)) < (new Date(b.date)) ? 1 : (new Date(a.date)) > (new Date(b.date)) ? -1 : 0; });

				for (var i=0; i<links.length; i++) {
					if (((req.user.facebookEnabled) && (links[i].source.trim().toLowerCase() == "facebook")) || 
						((req.user.twitterEnabled) && (links[i].source.trim().toLowerCase() == "twitter"))) {
						returnLinks.push({
							id: links[i]._id,
							source: links[i].source,
							ownerId: links[i].ownerId,
							ownerName: links[i].ownerName,
							message: links[i].message,
							title: links[i].title,
							summary: links[i].summary,
							url: links[i].url,
							imageUrls: links[i].imageUrls,
							date: links[i].date
						});
					}
				}

	        	res.send({ status: "success", links: returnLinks.slice(0,25) });
			}
		});
	}
};

exports.getMoreLinks = function (req, res) {
	if (!req.isAuthenticated()) { 
		dataError.log({
			model: __filename,
			action: "getLinkFeed",
			msg: "Unauthorized access",
			res: res
		});
	}
	else {
		Link
		.find({ owner: req.user._id })
		.exec(function(err, links) {
			if (err) {
				dataError.log({
					model: __filename,
					action: "getAllLinks",
					msg: "Error retrieving links",
					err: err,
					res: res
				});
			}
			else {
				var returnLinks = [],
					lastLinkFound = false;

				links.sort(function (a, b) { return (new Date(a.date)) < (new Date(b.date)) ? 1 : (new Date(a.date)) > (new Date(b.date)) ? -1 : 0; });

				for (var i=0; i<links.length; i++) {
					if (!lastLinkFound) {
						if (links[i]._id.toString() == req.params.lastLink.toString()) lastLinkFound = true;
					}
					else {
						if (((req.user.facebookEnabled) && (links[i].source.trim().toLowerCase() == "facebook")) || 
							((req.user.twitterEnabled) && (links[i].source.trim().toLowerCase() == "twitter"))) {
							returnLinks.push({
								id: links[i]._id,
								source: links[i].source,
								ownerId: links[i].ownerId,
								ownerName: links[i].ownerName,
								message: links[i].message,
								title: links[i].title,
								summary: links[i].summary,
								url: links[i].url,
								imageUrls: links[i].imageUrls,
								date: links[i].date
							});
						}
					}
				}

	        	res.send({ status: "success", links: returnLinks.slice(0,25) });
			}
		});
	}
};

exports.getNewFacebookLinks = function (req, res) {
	if (!req.isAuthenticated()) { 
		dataError.log({
			model: __filename,
			action: "getNewFacebookLinks",
			msg: "Unauthorized access",
			res: res
		});
	}
	else {
		User
		.findById(req.user._id)
		.exec(function(err, user) {
			if (err) {
				dataError.log({
					model: __filename,
					action: "getNewFacebookLinks",
					msg: "Error retrieving user",
					err: err,
					res: res
				});
			}
			else {
				var request = require('request');

				if ((user.lastFacebookMash) && (((new Date()-user.lastFacebookMash-1)/(1000*60*60*24)) < 1)) {
					var unixDayAgo = user.lastFacebookMash/1000;
				}
				else {
					var dayAgo = new Date();
					var unixDayAgo = (dayAgo.setDate(dayAgo.getDate() - 1))/1000;
				}


				var getUserURL = "https://graph.facebook.com/fql?q=SELECT%20uid%2Cname%20from%20user%20where%20uid%20in%20(SELECT%20actor_id%20FROM%20stream%20WHERE%20filter_key%20%3D%20%27nf%27%20AND%20type%20%3D%2080%20AND%20created_time%20>%20" + Math.ceil(unixDayAgo) + "%20LIMIT%20100)&access_token=" + user.facebookToken;
				
				// Send the request
				request.get({ url: getUserURL }, function(err, userResp, userBody) {
					var userData = [];

					try {
						if (JSON.parse(userBody).data) userData = JSON.parse(userBody).data;
					}
					catch (err) {
						dataError.log({
							model: __filename,
							action: "getNewFacebookLinks",
							msg: "Error parsing user links",
							err: err,
							res: res
						});	
					}

					var selectedUsers = {};
					var userIdList = "";

					for (var i=0; i<userData.length; i++) {
						selectedUsers[userData[i].uid] = userData[i].name;
						userIdList += (userData[i].uid + "%2C");
					}

					var facebookLinks = [];

					if (userIdList) {
						var getLinksUrl = "https://graph.facebook.com/fql?q=SELECT%20link_id%2C%20owner%2C%20image_urls%2C%20owner_comment%2C%20title%2C%20summary%2C%20url%2C%20created_time%20FROM%20link%20WHERE%20owner%20IN%20(" + userIdList.substring(0,userIdList.length-3) + ")%20AND%20created_time%20>%20" + Math.ceil(unixDayAgo) + "%20LIMIT%20100&access_token=" + user.facebookToken;

						// Send the request
						request.get({ url: getLinksUrl }, function(err, linkResp, linkBody) {
							try {
								var linkData = JSON.parse(linkBody).data;
							}
							catch (err) {
								dataError.log({
									model: __filename,
									action: "getNewFacebookLinks",
									msg: "Error parsing Facebook links",
									err: err,
									res: res
								});	

								var linkData = [];
							}

							for (var i=0; i<linkData.length; i++) {
								var link = new Link({
							    	owner: user._id,
									source: "facebook",
									linkId: linkData[i].link_id,
									ownerId: linkData[i].owner,
									ownerName: selectedUsers[linkData[i].owner],
									message: linkData[i].owner_comment,
									title: linkData[i].title,
									summary: linkData[i].summary,
									url: linkData[i].url,
									imageUrls: linkData[i].image_urls,
									date: new Date(linkData[i].created_time*1000)
								});

								link.save(function (err, savedUser) {
									if (err) {
										dataError.log({
											model: __filename,
											action: "getNewFacebookLinks",
											msg: "Error saving link",
											err: err,
											res: res
										});	
									}						
								});

								facebookLinks.push({
									source: "facebook",
									ownerId: linkData[i].owner,
									ownerName: selectedUsers[linkData[i].owner],
									message: linkData[i].owner_comment,
									title: linkData[i].title,
									summary: linkData[i].summary,
									url: linkData[i].url,
									imageUrls: linkData[i].image_urls,
									date: new Date(linkData[i].created_time*1000)
								});
							}

							user.lastFacebookMash = new Date();
							user.save();

				        	res.send({ status: "success", links: facebookLinks });
						});
					}
					else {
			        	res.send({ status: "success", links: [] });
					}
				});
			}
		});
	}
}

exports.getNewTwitterLinks = function (req, res) {
	if (!req.isAuthenticated()) { 
		dataError.log({
			model: __filename,
			action: "getNewTwitterLinks",
			msg: "Unauthorized access",
			res: res
		});
	}
	else {
		User
		.findById(req.user._id)
		.exec(function(err, user) {
			if (err) {
				dataError.log({
					model: __filename,
					action: "getNewFacebookLinks",
					msg: "Error retrieving user",
					err: err,
					res: res
				});
			}
			else {
				var OAuth= require('oauth').OAuth;

				var twitterGetUrl =  "";

				if ((user.lastTwitterMash) && (user.lastTwitterMash.trim().toLowerCase().length > 0)) {
					twitterGetUrl = "https://api.twitter.com/1.1/statuses/home_timeline.json?count=100&since_id=" + user.lastTwitterMash;
				}
				else {
					twitterGetUrl = "https://api.twitter.com/1.1/statuses/home_timeline.json?count=100";
				}

				var oa = new OAuth(
					"https://api.twitter.com/oauth/request_token", 
					"https://api.twitter.com/oauth/access_token", 
					config.twitterKey, 
					config.twitterKey, 
					"1.0A",
					"http://localhost:8080/auth/twitter/callback", 
					"HMAC-SHA1"
				);

				oa.get(
					twitterGetUrl, 
					user.twitterToken, 
					user.twitterTokenSecret, 
					function (e, data, response){
						try {
							var twitterData = JSON.parse(data);
						}
						catch (err) {
							dataError.log({
								model: __filename,
								action: "getNewTwitterLinks",
								msg: "Error parsing twitter posts",
								err: err,
								res: res
							});	

							var twitterData = [];
						}

						var twitterLinks = [];

						for (var i=0; i<twitterData.length; i++) {
							if ((twitterData[i].entities) && (twitterData[i].entities.urls) && (twitterData[i].entities.urls.length > 0)) {
								var link = new Link({
							    	owner: user._id,
									source: "twitter",
									linkId: twitterData[i].id,
									ownerId: twitterData[i].user.id,
									ownerName: twitterData[i].user.name + ":" + twitterData[i].user.screen_name,
									message: twitterData[i].text,
									title: "",
									summary: "",
									url: twitterData[i].entities.urls[0].expanded_url,
									imageUrls: "",
									date: new Date(twitterData[i].created_at)
								});

								link.save(function (err, savedUser) {
									if (err) {
										dataError.log({
											model: __filename,
											action: "getNewTwitterLinks",
											msg: "Error saving link",
											err: err,
											res: res
										});	
									}						
								});

								twitterLinks.push({
									source: "twitter",
									ownerId: twitterData[i].user.id ,
									ownerName: twitterData[i].user.name + ":" + twitterData[i].user.screen_name,
									message: twitterData[i].text,
									title: "",
									summary: "",
									url: twitterData[i].entities.urls[0].expanded_url,
									imageUrls: "",
									date: new Date(twitterData[i].created_at)
								});
							}
						}

						if (twitterData.length > 0) {
							user.lastTwitterMash = twitterData[0].id_str;
							user.save();
						}

    					res.send({ status: "success", links: twitterLinks });
					}
				);
			}
		});
	}
}

exports.setLinkRead = function (req, res) {
	if (!req.isAuthenticated()) { 
		dataError.log({
			model: __filename,
			action: "setLinkRead",
			msg: "Unauthorized access",
			res: res
		});
	}
	else {
		Link
		.findById(req.params.id)
		.exec(function(err, link) {
			if (err) {
				dataError.log({
					model: __filename,
					action: "setLinkRead",
					msg: "Error retrieving link",
					err: err,
					res: res
				});
			}
			else if (link) {
				var readLink = new ReadLink({
			    	owner: link.owner,
					source: link.source,
					ownerId: link.ownerId,
					ownerName: link.ownerName,
					message: link.message,
					title: link.title,
					summary: link.summary,
					url: link.url,
					imageUrls: link.imageUrls,
					date: link.date
				});

				readLink.save();

				link.remove();

    			res.send({ status: "success" });
			}
			else {
				dataError.log({
					model: __filename,
					action: "setLinkRead",
					msg: "Link not found",
					res: res
				});
			}
		});
	}
};

exports.setLinkDismissed = function (req, res) {
	if (!req.isAuthenticated()) { 
		dataError.log({
			model: __filename,
			action: "setLinkDismissed",
			msg: "Unauthorized access",
			res: res
		});
	}
	else {
		Link
		.findById(req.params.id)
		.exec(function(err, link) {
			if (err) {
				dataError.log({
					model: __filename,
					action: "setLinkDismissed",
					msg: "Error retrieving link",
					err: err,
					res: res
				});
			}
			else if (link) {
				var readLink = new DismissedLink({
			    	owner: link.owner,
					source: link.source,
					ownerId: link.ownerId,
					ownerName: link.ownerName,
					message: link.message,
					title: link.title,
					summary: link.summary,
					url: link.url,
					imageUrls: link.imageUrls,
					date: link.date
				});

				readLink.save();

				link.remove();

    			res.send({ status: "success" });
			}
			else {
				dataError.log({
					model: __filename,
					action: "setLinkDismissed",
					msg: "Link not found",
					res: res
				});
			}
		});
	}
};