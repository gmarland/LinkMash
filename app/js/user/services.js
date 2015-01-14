"use strict";

var app = angular.module("LinkMash.user.services", ["ngResource"]);

app.factory("User", ["$resource", function($resource){
	return $resource("/users/:id?random" + new Date().getTime(), { id: "@id" }, { 
		Update: { 
			method: "PUT", 
			isArray: false 
		}
	});
}]);

app.factory("UserFacebook", ["$resource", function($resource) {
  	return $resource("/users/facebook?random" + new Date().getTime(), null, { 
		Enable: { 
			method: "PUT", 
			isArray: false 
		},
		Disable: { 
			method: "DELETE", 
			isArray: false 
		}
	});
}]);

app.factory("UserTwitter", ["$resource", function($resource) {
  	return $resource("/users/twitter?random" + new Date().getTime(), null, { 
		Enable: { 
			method: "PUT", 
			isArray: false 
		},
		Disable: { 
			method: "DELETE", 
			isArray: false 
		}
	});
}]);