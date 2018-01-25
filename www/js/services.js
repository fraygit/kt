var services = angular.module("services", [ 'ngCordova' ]);

services.run(function($rootScope, KTConstant) {

	$rootScope.url = KTConstant.BASE_URL+"/api";
	// $rootScope.url = "http://52.26.249.130/api";
	// $rootScope.httpTimeout = 15000;
	// $rootScope.url = "http://127.0.0.1:3000/api";
});

services.service('login', login);
services.service('profile', profile);
services.service('contactUs', contactUs);
services.service('message', message);
// //////////////////////////////////////////

services.factory('WebService', function($http, $q, $rootScope, $httpParamSerializer, $state, $ionicLoading, $ionicPopup, LocalStore, refreshToken) {
	return {

		// make serve call without header
		makeServiceCall : function(url, params, apiMethod) {
			console.log('params: ' + JSON.stringify(params));
//			if (navigator.connection.type == Connection.NONE) {
//				var alertPopup = $ionicPopup.alert({
//					title : $rootScope.INTERNET_DISCONNECT, template : $rootScope.INTERNET_CONNECTION_MESSAGE
//				});
//			} else {
				$ionicLoading.show({
					template : $rootScope.LOADING_WAIT
				});
				var defer = $q.defer();

				$http({
				        headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
				        url: url,
				        method: apiMethod,
				        transformRequest: $httpParamSerializer,
				        transformResponse: function (x) {
				          return angular.fromJson(angular.fromJson(x));
				        },
				        data: params
				      })
				      .then(function(response) {
				        console.log(response);
								$ionicLoading.hide();
				        defer.resolve(response);
				      }, function(error) {
								$ionicLoading.hide();
								defer.reject(error);
							});
							return defer.promise;
		},

		// serve call with header
		makeServiceCallHeader : function(url, params, apiMethod, token) {
			console.log('params: ' + JSON.stringify(params));
//			if (navigator.connection.type == Connection.NONE) {
//				var alertPopup = $ionicPopup.alert({
//					title : $rootScope.INTERNET_DISCONNECT, template : $rootScope.INTERNET_CONNECTION_MESSAGE
//				});
//			} else {
				$ionicLoading.show({
					template : $rootScope.LOADING_WAIT
				});
				var defer = $q.defer();
				$http({
					method : apiMethod, url : url, data : params, headers : {
						'Authorization' : 'Token token=' + token
					}
				}).success(function(data) {
					console.log(' Response Data here: ', data);
					$ionicLoading.hide();
					defer.resolve(data);
				}).error(function(data) {
					$ionicLoading.hide();
					defer.reject(data);
				});
				return defer.promise;
//			}
		},

		showAlert : function(message) {
			var alertPopup = $ionicPopup.alert({
				title : "Kangarootime", template : '' + message, buttons : [ {
					text : '<b>' + "OK" + '</b>', type : 'button-dark', onTap : function(e) {
					}
				} ]
			});

		},

		showConfirm : function(message, func) {
			var confirmPopup = $ionicPopup.confirm({
				title : "New Message",
				template : '' + message,
				cancelText: 'No',
				cancelType: 'button-dark',
				okText: 'Yes',
				okType: 'button-positive'
			});

			confirmPopup.then(func);
		}
		, connectionCheck : function() {
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

			// $ionicHistory.nextViewOptions( {
			// disableBack: true
			// });

			$state.go(templateHtml);
		},
	};
});

services.service('refreshToken', function($state, $http, $rootScope, $q, $ionicLoading, UpdateAPI, LocalStore, $ionicPopup) {
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
					}).success(function(data) {
				$ionicLoading.hide();
				if (data.status == 604) {
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
				title : "Kangarootime", template : '' + message, buttons : [ {
					text : '<b>' + "OK" + '</b>', type : 'button-dark', onTap : function(e) {
					}
				} ]
			});
		}
	}
});

services.service('UpdateAPI', function($http, $q, $rootScope, $ionicLoading, LocalStore, $ionicPopup) {
	return {
		updateResult : function(url, params, apiMethod, header) {
			header.authorizationkey = LocalStore.getPrefrenses($rootScope.ACCESS_TOKEN);
			var defer = $q.defer();
			$http({
				method : apiMethod, url : url, data : params, headers : header
			}).success(function(data) {
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

services.factory('CheckInService', function() {
	var checkInList = [];
	var addCheckInList = function(list) {
		checkInList = list;
	};

	var getCheckInList = function() {
		return checkInList;
	};

	return {
		addCheckInList : addCheckInList, getCheckInList : getCheckInList
	};

});
services.factory('CheckOutService', function() {
	var checkOutList = [];
	var addCheckOutList = function(list) {
		checkOutList = list;
	};

	var getCheckOutList = function() {
		return checkOutList;
	};

	return {
		addCheckOutList : addCheckOutList, getCheckOutList : getCheckOutList
	};

});

services.service('CalendarEventService', function() {
	var Event = "";
	var addEvent = function(event) {
		Event = event;
	};
	var getEvent = function() {
		return Event;
	};
	return {
		addEvent : addEvent, getEvent : getEvent
	};
});

services.service('EditChildService', function() {
	var EditChild = "";
	var addChildDetail = function(editChild) {
		EditChild = editChild;
	};
	var getChildDetail = function() {
		return EditChild;
	};
	return {
		addChildDetail : addChildDetail, getChildDetail : getChildDetail
	};
});

services.service('AllEventService', function() {
	var Events = "";
	var addAllEvent = function(allEvent) {
		Events = allEvent;
	};
	var getAllEvent = function() {
		return Events;
	};
	return {
		addAllEvent : addAllEvent, getAllEvent : getAllEvent
	};
});

services.factory('LocalStore', function($window, $rootScope) {
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

services.factory('$utils', function($rootScope) {
	var utils = {

		formatDecimalWithCommas: function(decimal){
			var n= decimal.toString().split(".");
			n[0] = n[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return n.join(".");
		},

		padding: function(n, width, z) {
			z = z || '0';
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
		},
	};

	utils.getDateString = function(dt, hasSep){

		if (!dt) return "";

		if (typeof hasSep === "undefined") hasSep = true; else hasSep = false;

		var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
		var val = new Date(dt);
		var retVal = monthNames[val.getMonth()] + " " + utils.padding(val.getDate(), 2) + (hasSep?", ":" ") + val.getFullYear();

		return retVal;
	};

	utils.formatCurrencyWithCommas = function(decimal){
		var stringVal = utils.formatDecimalWithCommas(parseFloat(decimal).toFixed(2));
		if (stringVal.indexOf('-') == 0)
			stringVal = stringVal.replace('-', '-$');
		else
			stringVal = '$' + stringVal;

		return stringVal;
	};

	return utils;
});

// ////////////////////////

function login($http, $rootScope) {
	return {
		logout : function(token) {
			return $http({
				method : 'DELETE', url : $rootScope.url + '/v1/signout', headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, signIn : function(email, password) {
			return $http({
				method : 'POST', url : $rootScope.url + '/v1/login', data : {
					email : email, password : password
				}
			});
		}
	};
};

function profile($http, $rootScope, KTConstant) {
	return {
		userProfile : function(token) {
			// alert("in dash");
			return $http({
				method : 'GET', url : $rootScope.url + '/v1/parent_profile', headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, allDetailswithChild : function(token) {
			// alert("in dash");
			return $http({
				method : 'GET', url : $rootScope.url + '/v1/view_profile', headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, galleries : function(token) {
			return $http({
				method : 'GET', url : $rootScope.url + '/v1/view_gallery', headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, editprofile : function(url, params, token) {
			return $http({
				method : 'GET', url : KTConstant.BASE_URL+'/api/v1/edit_profile?' + params,
				// params : params,
				headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}
	};
}

;
function contactUs($http, $rootScope) {
	return {
		contact : function(name, email, phone, info) {
			alert("Contact Us");
			return $http({
				method : 'POST', url : $rootScope.url + '/v1/create_contact', data : {
					name : name, email : email, phone : phone, info : info
				}
			});
		}
	};
}

;

function message($http, $rootScope) {
	return {
		allMessage : function(token, type) {
			return $http({
				method : 'GET', url : $rootScope.url + '/v2/messages/mailbox', params : {
					mailbox : type
				}, headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, showMessage : function(token, mid) {
			return $http({
				method : 'GET', url : $rootScope.url + '/v2/messages/' + mid,
        headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, newMessage : function(token, subject, body, file) {

			return $http({
				method : 'POST', url : $rootScope.url + '/v2/messages', params : {
					subject : subject, body : body
				}, data : {
					image : file
				}, headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, replyMessage : function(token, subject, body, mid) {
			return $http({
				method : 'POST', url : $rootScope.url + '/v2/messages/' + mid + '/reply', params : {
					subject : subject, body : body
				}, headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, deleteorfavoriteMessage : function(token, mid, status) {
			return $http({
				method : 'GET', url : $rootScope.url + '/v2/messages/' + mid + '/update_status', params : {
					status : status
				}, headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}, favoriteMessage : function(token, msgcode, status) {
			return $http({
				method : 'GET', url : $rootScope.url + '/v2/messages/' + msgcode + '/update_status', params : {
					status : status
				}, headers : {
					'Authorization' : 'Token token=' + token
				}
			});
		}
	};
}

;
