"use strict";

angular.module("LinkMash").controller("LoginCtrl", ["$scope", "$http", "$location", "$window", "$remember", "$forget", "User", function($scope, $http, $location, $window, $remember, $forget, User) {
	$scope.showPage = false;

	$http.get("/checkAuthenticated?random=" + new Date().getTime(), { cache: "false"}).success(function(response) {
		if (response.status.trim().toLowerCase() == "success") {
          $location.path('/main');
		}
		else {
			$scope.showPage = true;

			var emailFilter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

		    $scope.loginUser = { email: "", password: "" };
			$scope.stayLoggedIn = true;
			
			$scope.landing = function() {
				$window.location.href = "/";
			}

			$scope.logIn = function() {
				$location.path('/login');
			}

			$scope.createAnAccount = function() {
				$location.path('/signup');
			}
			
			$scope.authenticateUser = function() {
				$scope.loginAlert = null;

				if (((this.loginUser.email) && (this.loginUser.email.trim().toLowerCase().length > 0)) && 
					((this.loginUser.password) && (this.loginUser.password.trim().toLowerCase().length > 0))) {
					var that = this;

					var selectedUser = {
					    username: this.loginUser.email.trim(),
					    password: this.loginUser.password
					}

					$http.post("/auth", selectedUser).success(function(response) { 
						if (response.status.trim().toLowerCase() == "success") {
							if (that.stayLoggedIn) {
								$remember("LinkMash_sessionId", response.user.sessionId);
							}

          					$window.location.href = "/main";
						}
						else {
							$scope.loginAlert = response.message;

							that.loginUser.password = "";
						}	
					});
				}
				else {
					if (((!this.loginUser.email) || (this.loginUser.email.trim().toLowerCase().length == 0)) && ((!this.loginUser.password) || (this.loginUser.password.trim().toLowerCase().length == 0))) {
		    			$scope.loginAlert = "E-mail and password required";
					}
					else {
						if ((!this.loginUser.email) || (this.loginUser.email.trim().toLowerCase().length == 0)) {
			    			$scope.loginAlert = "E-mail required";
						}

						if ((!this.loginUser.password) || (this.loginUser.password.trim().toLowerCase().length == 0)) {
			    			$scope.loginAlert = "Password required";
						}
					}
				}
			}

			$scope.forgotPassword = function() {
	            var forgotPasswordInstance = $modal.open({
	              templateUrl: "/app/partials/user/forgotPassword.html",
	              controller: "ForgotPasswordCtrl"
	            });
			}
		}
	});
}]);