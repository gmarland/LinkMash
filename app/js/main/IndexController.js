"use strict";

angular.module("LinkMash").controller("IndexCtrl", ["$scope", "$http", "$location", "$window", "$forget", "UserFacebook", "UserTwitter", "LinkAction", "Links", "MoreLinks", "FacebookLinks", "TwitterLinks", function($scope, $http, $location, $window, $forget, UserFacebook, UserTwitter, LinkAction, Links, MoreLinks, FacebookLinks, TwitterLinks) {
	$http.get("/checkAuthenticated?random=" + new Date().getTime(), { cache: "false"}).success(function(response) {
		if (response.status.trim().toLowerCase() == "success") {
			$scope.user = response.user;
			$scope.links = [];
			$scope.readLinks = [];
			$scope.bookmarkedLinks = [];
			$scope.linksLoading = false;

			$scope.showSettings = ((!$scope.user.facebookEnabled) && (!$scope.user.twitterEnabled));
			$scope.showProfile = false;
			$scope.showMore = false;

			$scope.LoadLinks = function() {
				$scope.linksLoading = true;

				Links.get(function (linksResponse)  { 
					if (linksResponse.status.trim().toLowerCase() == "success") {
						$scope.links = [];
						$scope.links = $scope.links.concat(linksResponse.links);

						if ($scope.links.length == 25) $scope.showMore = true;
						if (($scope.links.length > 0) || (($scope.links.length == 0) && ((!$scope.user.facebookEnabled) && (!$scope.user.twitterEnabled)))) $scope.linksLoading = false;

						if ($scope.user.facebookEnabled) {
							FacebookLinks.get(function (facebookLinksResponse)  { 
								if (facebookLinksResponse.status.trim().toLowerCase() == "success") {
									$scope.links = $scope.links.concat(facebookLinksResponse.links);
									$scope.links.sort(function (a, b) { return (new Date(a.date)) < (new Date(b.date)) ? 1 : (new Date(a.date)) > (new Date(b.date)) ? -1 : 0; });
								}

								$scope.linksLoading = false;
							});
						}

						if ($scope.user.twitterEnabled) {
							TwitterLinks.get(function (twitterLinksResponse)  { 
								if (twitterLinksResponse.status.trim().toLowerCase() == "success") {
									$scope.links = $scope.links.concat(twitterLinksResponse.links);
									$scope.links.sort(function (a, b) { return (new Date(a.date)) < (new Date(b.date)) ? 1 : (new Date(a.date)) > (new Date(b.date)) ? -1 : 0; });
								}

								$scope.linksLoading = false;
							});
						}
					}
					else $scope.linksLoading = false;
				});
			};

			$scope.LoadMoreLinks = function() {
				if ($scope.links.length > 0) {
					$scope.linksLoading = true;

					MoreLinks.get({ lastLink: $scope.links[$scope.links.length-1].id }, function(linksResponse) { 
						if (linksResponse.status.trim().toLowerCase() == "success") {
							$scope.linksLoading = false;

							$scope.links = $scope.links.concat(linksResponse.links);

							if (linksResponse.links.length < 25) $scope.showMore = false;
						}
					});
				}
			};

			$scope.RefreshLinks = function() {
				var facebookLoaded = false,
					twitterLoaded = false;

				$scope.linksLoading = true;

				if ($scope.user.facebookEnabled) {
					FacebookLinks.get(function (facebookLinksResponse)  {
						facebookLoaded = true;
						if (twitterLoaded) $scope.linksLoading = false;

						if (facebookLinksResponse.status.trim().toLowerCase() == "success") {
							$scope.links = $scope.links.concat(facebookLinksResponse.links);
							$scope.links.sort(function (a, b) { return (new Date(a.date)) < (new Date(b.date)) ? 1 : (new Date(a.date)) > (new Date(b.date)) ? -1 : 0; });
						}
					});
				}
				else facebookLoaded = true;

				if ($scope.user.twitterEnabled) {
					TwitterLinks.get(function (twitterLinksResponse)  { 
						twitterLoaded = true;
						if (facebookLoaded) $scope.linksLoading = false;

						if (twitterLinksResponse.status.trim().toLowerCase() == "success") {
							$scope.links = $scope.links.concat(twitterLinksResponse.links);
							$scope.links.sort(function (a, b) { return (new Date(a.date)) < (new Date(b.date)) ? 1 : (new Date(a.date)) > (new Date(b.date)) ? -1 : 0; });
						}
					});
				}
				else twitterLoaded = true;
			}

			$scope.LoadLinks();

			setInterval(function() {
				var loadingSpan = document.getElementById("loading-ellipses");

				if (loadingSpan.innerHTML == ".") loadingSpan.innerHTML = "..";
				else if (loadingSpan.innerHTML == "..") loadingSpan.innerHTML = "...";
				else if (loadingSpan.innerHTML == "...") loadingSpan.innerHTML = "....";
				else if (loadingSpan.innerHTML == "....") loadingSpan.innerHTML = ".";
			}, 800);

			$scope.SelectScanFacebook = function() {
				if (($scope.user.facebookEnabled) && ($scope.user.facebookAuthenticated)) {
					$scope.user.facebookEnabled = false;
            		
            		UserFacebook.Disable();

            		for (var i=($scope.links.length-1); i >= 0 ; i--) {
            			if ($scope.links[i].source.trim().toLowerCase() == "facebook") $scope.links.splice(i,1);
            		}
				}
				else {
					if (!$scope.user.facebookAuthenticated) {
	            		UserFacebook.Enable(function() {
							$window.location.href = "/auth/facebook";
	            		});
					}
					else {
	            		UserFacebook.Enable(function() {
							$scope.LoadLinks();
	            		});
						
						$scope.user.facebookEnabled = true;
					}
				}
			};

			$scope.SelectScanTwitter = function() {
				if (($scope.user.twitterEnabled) && ($scope.user.twitterAuthenticated)) {
					$scope.user.twitterEnabled = false;
            		
            		UserTwitter.Disable();

            		for (var i=($scope.links.length-1); i >= 0; i--) {
            			if ($scope.links[i].source.trim().toLowerCase() == "twitter") $scope.links.splice(i,1);
            		}
				}
				else {
					if (!$scope.user.twitterAuthenticated) {
	            		UserTwitter.Enable(function() {
							$window.location.href = "/auth/twitter";
	            		});
					}
            		else {
						$scope.user.twitterEnabled = true;

	            		UserTwitter.Enable(function() {
							$scope.LoadLinks();
	            		});
					}
				}
			};

			$scope.ToggleSettings = function() {
				if ($scope.showSettings) $scope.showSettings = false;
				else $scope.showSettings = true;

				$scope.showProfile = false;
			};

			$scope.ToggleProfile = function() {
				if ($scope.showProfile) $scope.showProfile = false;
				else $scope.showProfile = true;

				$scope.showSettings = false;
			};

			$scope.OpenLink = function(link) {
        		for (var i=0; i < $scope.links.length; i++) {
        			if ($scope.links[i].id == link.id) {
        				$scope.links.splice(i,1);
	        			break;
	        		}
        		}

        		LinkAction.Read({ id: link.id });

    			$window.open(link.url);		
			};

			$scope.DimissLink = function(link) {
        		for (var i=0; i < $scope.links.length; i++) {
        			if ($scope.links[i].id == link.id) {
        				$scope.links.splice(i,1);
	        			break;
	        		}
        		}

        		LinkAction.Dismissed({ id: link.id });
			};

			$scope.GetName = function(link) {
				if (link.ownerName.indexOf(":") > -1) {
					var parts = link.ownerName.split(":");

					return parts[0];
				}
				else return link.ownerName;
			};

			$scope.GetUsername = function(link) {
				var parts = link.ownerName.split(":");

				if (parts.length == 2) {
					if (link.source.trim().toLowerCase() == "twitter") return "@" + parts[1];
					else return parts[1];
				}
				else return "";
			};

			$scope.GetURLDescription = function(link) {
				if (link.message) return link.message;
				else return link.summary;
			};

			$scope.GetURLTitle = function(link) {
				if (link.title) return link.title;
				else return link.url;
			};

			$scope.LogoutUser = function() {
				$http.delete("/auth").success(function(response) { 
					$forget("LinkMash_sessionId");

					$window.location.href = "/";
				});
			}
		}
		else $window.location.href = "/";
	});
}]);