"use strict";

angular.module("LinkMash").controller("LandingCtrl", ["$scope", "$http", "$location", "$window", "User", function($scope, $http, $location, $window, User) {
	$scope.showPage = false;

	$http.get("/checkAuthenticated?random=" + new Date().getTime(), { cache: "false"}).success(function(response) {
		if (response.status.trim().toLowerCase() == "success") {
          	$location.path('/main');
		}
		else {
			$scope.showPage = true;

			$scope.landing = function() {
				$window.location.href = "/";
			}

			$scope.logIn = function() {
				$window.location.href = "/login";
			}

			$scope.createAnAccount = function() {
				$window.location.href = "/signup";
			}
		}
	});	
}]);