"use strict";

/* App Module */
var module = angular.module("LinkMash", ["ngRoute", "ngSanitize"]);
var module = angular.module("main", ["LinkMash", "LinkMash.common.services", "LinkMash.user.services", "LinkMash.link.services"]);

module.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
  	$routeProvider.when("/", { templateUrl: "/app/partials/landing/index.html", controller: "LandingCtrl"});
  	$routeProvider.when("/login", { templateUrl: "/app/partials/landing/login.html", controller: "LoginCtrl"});
  	$routeProvider.when("/signup", { templateUrl: "/app/partials/landing/signUp.html", controller: "SignUpCtrl"});
  	$routeProvider.when("/main", { templateUrl: "/app/partials/main/index.html", controller: "IndexCtrl"});

  	$locationProvider.html5Mode(true);
}]);