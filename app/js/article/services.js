"use strict";

var app = angular.module("LinkMash.link.services", []);

app.factory("Links", ["$resource", function($resource) {
  return $resource("/links?random" + new Date().getTime());
}]);

app.factory("MoreLinks", ["$resource", function($resource){
  return $resource("/links/more/:lastLink?random" + new Date().getTime(), { lastLink:'@lastLink' });
}]);

app.factory("FacebookLinks", ["$resource", function($resource){
  return $resource("/links/feed/facebook?random" + new Date().getTime());
}]);

app.factory("TwitterLinks", ["$resource", function($resource){
  return $resource("/links/feed/twitter?random" + new Date().getTime());
}]);

app.factory("LinkAction", ["$resource", function($resource) {
  	return $resource("/links/:id?random" + new Date().getTime(), { id: '@id' }, { 
		Read: { 
			method: "PUT", 
			isArray: false 
		},
		Dismissed: { 
			method: "DELETE", 
			isArray: false 
		}
	});
}]);