var appM = angular.module('networkutils', [ 'ngCordova' ]);

appM.factory('WebService', function($http, $q, $rootScope, $state, $ionicLoading, $ionicPopup, $ionicHistory, LocalStore, refreshToken) {
	return {
		makeServiceCall : function(url, params, apiMethod, header) {
			console.log('params: ' + JSON.stringify(params) + " Headers: " + header);
			if (navigator.connection.type == Connection.NONE) {
				var alertPopup = $ionicPopup.alert({
					title : $rootScope.INTERNET_DISCONNECT, template : $rootScope.INTERNET_CONNECTION_MESSAGE
				});
			} else {
				$ionicLoading.show({
					template : $rootScope.LOADING_WAIT
				});
				var defer = $q.defer();
				$http({
					method : apiMethod, url : url, data : params, headers : header
				}).success(function(data, status, header, config) {
					console.log(status + ' Response Data: ' + JSON.stringify(data));
					$ionicLoading.hide();
					if (data.statusCode == 200) { // Success
						defer.resolve(data);
					} else {
						refreshToken.validationAlert("server error");
					}
				}).error(function(data, status, header, config) {
					$ionicLoading.hide();
					if (data.statusCode == 607) {
						var result = refreshToken.refresh(url, params, apiMethod, header);
						result.then(function(response) {
							defer.resolve(response);
						}, function(response) {
							defer.reject(response);
						});
					} else {
						defer.reject(data);
					}
				});

				return defer.promise;
			}
		}, showAlert : function(message) {
			var alertPopup = $ionicPopup.alert({
				title : "Kangaroo-Time", template : '' + message, buttons : [ {
					text : '<b>' + "OK" + '</b>', type : 'button-dark', onTap : function(e) {
					}
				} ]
			});

		}, connectionCheck : function() {
			if (navigator.connection.type == Connection.NONE) {
				$ionicPopup.confirm({
					title : $rootScope.INTERNET_DISCONNECT, content : $rootScope.INTERNET_CONNECTION_MESSAGE
				}).then(function(result) {
					if (!result) {
						ionic.Platform.exitApp();
					}
				});
			}
		}, logoutMerchant : function(templateHtml) {
			LocalStore.setPrefrenses($rootScope.ACCESS_TOKEN, '');
			LocalStore.setPrefrenses($rootScope.MERCHANT_ID, '');

			$ionicHistory.nextViewOptions({
				disableBack : true
			});

			$state.go(templateHtml);
		},
	};
});

appM.service('refreshToken', function($state, $http, $rootScope, $q, $ionicHistory, $ionicLoading, UpdateAPI, LocalStore, $ionicPopup) {
	return {
		refresh : function(url, params, apiMethod, header) {
			var defer = $q.defer();

			$http(
					{
						method : $rootScope.GET,
						url : $rootScope.BASE_URL + '/refreshToken',
						data : '',
						headers : {
							clientid : $rootScope.CLIENT_ID, secretkey : $rootScope.SECRET_KEY,
							access_token : LocalStore.getPrefrenses($rootScope.ACCESS_TOKEN)
						}
					}).success(function(data, status, header, config) {
				$ionicLoading.hide();
				if (data.statusCode == 604) {
					LocalStore.setPrefrenses($rootScope.ACCESS_TOKEN, data.access_token);
					var UpdatedResult = UpdateAPI.updateResult(url, params, apiMethod, header);
					UpdatedResult.then(function(response) {
						defer.resolve(response);
					}, function(response) {
						defer.reject(response);
					});
				}
			}).error(function(data, status, header, config) {
				$ionicLoading.hide();
				defer.reject(data);
			});
			return defer.promise;

		}, validationAlert : function(message) {
			var alertPopup = $ionicPopup.alert({
				title : "Kangaroo-Time", template : '' + message, buttons : [ {
					text : '<b>' + "OK" + '</b>', type : 'button-dark', onTap : function(e) {
					}
				} ]
			});
		}
	}
});

appM.service('UpdateAPI', function($http, $q, $rootScope, $ionicLoading, LocalStore, $ionicPopup) {
	return {
		updateResult : function(url, params, apiMethod, header) {
			header.authorizationkey = LocalStore.getPrefrenses($rootScope.ACCESS_TOKEN);
			var defer = $q.defer();
			$http({
				method : apiMethod, url : url, data : params, headers : header
			}).success(function(data, status, header, config) {
				$ionicLoading.hide();
				defer.resolve(data);

			}).error(function(data, status, header, config) {
				$ionicLoading.hide();
				defer.reject(data);
			});
			return defer.promise;
		},
	}
});

appM.factory('LocalStore', function($window, $rootScope) {
	return {
		setPrefrenses : function(key, value) {
			window.localStorage.setItem(key, value);
		}, getPrefrenses : function(key) {
			return window.localStorage.getItem(key);
		}, setOjectPref : function(key, val) {
			$window.localStorage && $window.localStorage.setItem(key, val);
			return this;
		}, getOjectPref : function(key) {
			return $window.localStorage && $window.localStorage.getItem(key);
		}, clearAll : function(key) {
			$window.localStorage && $window.localStorage.setItem(key, null);
		}

	};
});
