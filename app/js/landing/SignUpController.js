"use strict";

angular.module("LinkMash").controller("SignUpCtrl", ["$scope", "$http", "$location", "$window", "$remember", "$forget", "User", function($scope, $http, $location, $window, $remember, $forget, User) {
	$http.get("/checkAuthenticated?random=" + new Date().getTime(), { cache: "false"}).success(function(response) {
		$scope.showPage = false;

		if (response.status.trim().toLowerCase() == "success") {
          $location.path('/main');
		}
		else {
			$scope.showPage = true;

			var emailFilter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

		    $scope.createUser = { email: "", password: "", passwordConfirm: "" };

			$scope.landing = function() {
				$window.location.href = "/";
			}
			
			$scope.logIn = function() {
				$location.path('/login');
			}

			$scope.createAnAccount = function() {
				$location.path('/signup');
			}

			$scope.createNewUser = function() {
			    $scope.createAlert = null;

				if (((this.createUser.email) && (this.createUser.email.trim().toLowerCase().length > 0)) && 
					((this.createUser.password) && (this.createUser.password.trim().toLowerCase().length > 0))) {
					if (this.createUser.password == this.createUser.passwordConfirm) {
						if (emailFilter.test(this.createUser.email)) {

							var that = this;

							var newUser = {
							    email: this.createUser.email.trim(),
							    password: this.createUser.password
							}

							User.save({}, newUser, function(response) {
								if (response.status.trim().toLowerCase() == "success") {
									var selectedUser = {
									    username: that.createUser.email.trim(),
									    password: that.createUser.password
									}

									$http.post("/auth", selectedUser).success(function(response) { 
										if (response.status.trim().toLowerCase() == "success") {
											if (that.stayLoggedIn) {
												$remember("LinkMash_sessionId", response.user.sessionId);
											}

				          					$window.location.href = "/main";
										}
										else {
											$scope.createAlert = response.message;

											that.loginUser.password = "";
										}	
									});
								}
								else {
									$scope.createAlert = response.error;

									that.createUser.password = "";
								}
							});
						}
						else {
			    			$scope.createAlert = "Invalid e-mail";
						}
					}
					else {
		    			$scope.createAlert = "Passwords much match";
					}
				}
				else {
					if (((!this.createUser.email) || (this.createUser.email.trim().toLowerCase().length == 0)) && ((!this.createUser.password) || (this.createUser.password.trim().toLowerCase().length == 0))) {
		    			$scope.createAlert = "E-mail and password required";
					}
					else {
						if ((!this.createUser.email) || (this.createUser.email.trim().toLowerCase().length == 0)) {
			    			$scope.createAlert = "E-mail required";
						}

						if ((!this.createUser.password) || (this.createUser.password.trim().toLowerCase().length == 0)) {
			    			$scope.createAlert = "Password required";
						}
					}
				}
			}
		}
	});
}]);