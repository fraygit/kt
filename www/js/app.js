
var kangaroo = angular.module("kangaroo", ['ionic', 'ionic.cloud', 'kangarooRoutes', 'services','ngStorage', 'ngResource', 'ui.bootstrap', 'ngCordova', 'checklist-model','ui.rCalendar', 'ngCordovaOauth']);

kangaroo.config(function($ionicCloudProvider) {
  $ionicCloudProvider.init({
    "core": {
      "app_id": "ab5847ff"
    }
  });
});

kangaroo.run(function($rootScope, $location, $ionicPopup, $ionicPlatform, login ,KTConstant, WebService, $cordovaPushV5) {

  $rootScope.url = KTConstant.BASE_URL+"/api";
  $rootScope.INTERNET_DISCONNECT="Internet Disconnected";
  $rootScope.LOADING_WAIT='Loading...';
  $rootScope.INTERNET_CONNECTION_MESSAGE="Please check network connection on your device.";
  $rootScope.SERVER_ERROR="Server Error";
  $rootScope.POST='POST';
  $rootScope.GET='GET';
  var userid='';

  $rootScope.checkInChildrenData='';

  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }

    var isLoggedIn = typeof window.localStorage['token'] !== "undefined";
    var pnRegId = window.localStorage['pn_reg_id'];

    var options = {
      android: {
        senderID: "648216525680",
        // senderID: "63208898506", // old senderID
        forceShow: true
      },
      ios: {
        alert: true,
        badge: true,
        sound: true,
        clearBadge: true
      }
    };

    if (!window.PushNotification) return;

    $cordovaPushV5.initialize(options).then(function() {
      console.log("init push begins");
      $cordovaPushV5.onNotification();
      $cordovaPushV5.onError();

      $cordovaPushV5.register().then(function(registrationId) {
        console.log("push regID here",registrationId);
        if (isLoggedIn){
          if (pnRegId !== registrationId){
            // resend reg_id and update local reg_id only on success
            window.localStorage['pn_reg_id_2']=registrationId;
          }
        }else{
          window.localStorage['pn_reg_id'] = registrationId;
        }

        // alert(registrationId);
      }).catch(function(err){console.log(err,"err registrationID")});
    }).catch(function(err){console.log("push init failed",err); });

    // triggered every time notification received
    $rootScope.$on('$cordovaPushV5:notificationReceived', function(event, data){
      if (data.additionalData.origin == "message_section"){
        if (ionic.Platform.isAndroid()){
          $rootScope.$apply($rootScope.goToMessage(data.additionalData.message_id));
        }else{
          WebService.showConfirm("A new message was sent to your inbox. Do you want to check it out now?", function(res){
            if (res) $rootScope.goToMessage(data.additionalData.message_id);
          });
        }
      }
    });

    // triggered every time error occurs
    $rootScope.$on('$cordovaPushV5:errorOcurred', function(event, e){
      console.log("err occ",event,e);
      alert(e.message);
    });

    cordova.plugins.photoLibrary.requestAuthorization(
      function (success) {
        // User gave us permission to his library, retry reading it!
        console.log("Success on permission photoLibrary", success);
      },
      function (err) {
        // User denied the access
        console.log("Error on permission photoLibrary", err);
      }, // if options not provided, defaults to {read: true}.
      {
        read: true,
        write: true
      }
    );

  });

  $rootScope.goToMessage = function(id){
    $location.path("/messageView/").search({
      MID: id
    });
  };

  document.addEventListener('backbutton', function(event) {
    var currentUrl = window.location.hash;
    if (currentUrl == "#/dashboard"||currentUrl == "#/signIn") {
      navigator.app.exitApp();
    } else {
      history.go(-1);
      navigator.app.backhistory();
    }
  });

});



kangaroo.controller('signInController', function signInController($scope,$rootScope,$stateParams,$localStorage, $location, KTConstant, login,WebService,LocalStore, $state, $ionicLoading,$location, $cordovaOauth, $q, $http, $cordovaDevice) {
  if (window.localStorage['token'] != undefined) {
    $location.path("/dashboard");
  }

  $rootScope.checkInChildrenData='';
  $scope.data={};
  $scope.data.email=window.localStorage['user_email'];
  $scope.data.password='';
  $scope.loginFB = function() {
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

    $cordovaOauth.facebook("447073565475718", ["email", "public_profile"]).then(function(result) {
      displayData($http, result.access_token);
      var name = result.data.name;
      var gender = result.data.gender;
      var location = result.data.location;
      var picture = result.data.picture;

    }, function(error) {
      console.log(error);
    });
  };
  function displayData($http, access_token)
  {
    $http.get("https://graph.facebook.com/v2.2/me", {params: {access_token: access_token, fields: "name,gender,location,picture,email", format: "json" }}).then(function(result)
      {

        console.log(JSON.stringify(result));
        var name = result.data.name;
        var gender = result.data.gender;
        var location = result.data.location;
        var picture = result.data.picture;
        var id =result.data.id;
        var userid=id;

        var params={
        };
        var url=$rootScope.url + '/v1/login_with_social_media?prtovider=facebook&uid='+userid+'&submit=save';
        var result=WebService.makeServiceCall(url,params, $rootScope.POST);
        result.then(function(response){

          console.log(''+JSON.stringify(response));
          if (response.status == 200) {
            window.localStorage['token'] = response.token;
            $location.path("/dashboard");
          } else {
            WebService.showAlert(response.message);
            $location.path("/signIn");
          }
        },function(response) {
          console.log(''+JSON.stringify(response));
        });
      }, function(error) {
        WebService.showAlert("There was a problem getting your profile.  Check the logs for details.");
        console.log(error);
      });
  }

  $scope.loginGoogle = function() {
    var requestToken = '';
    var accessToken = '';
    var clientId = '1018908884240-futc1bfc681kl2jegi3a7nn1m28aem1o.apps.googleusercontent.com';
    var clientSecret = 'KRQGDwu_llvagUucKM9oLZ7I';
    var deferred = $q.defer();
    $cordovaOauth.google(clientId, ['email']).then(function(result) {
      $localStorage.accessToken = result.access_token;
      deferred.resolve(result.access_token);

      $http.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + $localStorage.accessToken, {

        params: {
          format: 'json'
        }
      }).then(function(result) {
        console.log(JSON.stringify(result));
        var id =result.data.id;
        var params={};
        var url=$rootScope.url + '/v1/login_with_social_media?prtovider=google_oauth2&uid='+id+'&submit=save';

        var result=WebService.makeServiceCall(url,params, $rootScope.POST);
        result.then(function(response){
          // WebService.showAlert(JSON.stringify(response));
          console.log(''+JSON.stringify(response));
          if (response.status == 200) {
            window.localStorage['token'] = response.token;
            $location.path("/dashboard");
          } else {
            WebService.showAlert(response.message);
            $location.path("/signIn");
          }
        },function(response) {
          console.log(''+JSON.stringify(response));
        });

        deferred.resolve(result.data);
      }, function(error) {
        deferred.reject({
          message: 'here was a problem getting your profile',
          response: error
        });
      });


    }, function(error) {
      deferred.reject({
        message: 'There was a problem signing in',
        response: error
      });
    });
  }
  $scope.submit = function(data) {
    var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(data.email==''||data.email==undefined){
      WebService.showAlert("Please Enter Email");
    } else if (data.password == ''|| data.password == undefined) {
      WebService.showAlert("Please enter password");
    } else {

      var device_model = null, device_uuid = null, mobile_os_version = null;
      if (window.device){
        device_model = $cordovaDevice.getModel();
        device_uuid = $cordovaDevice.getUUID();
        mobile_os_version = $cordovaDevice.getVersion();
      }

      var params={
        email: data.email,
        password: data.password,
        device_type: ionic.Platform.isAndroid()?'android':'ios',
        registration_id:window.localStorage['pn_reg_id']? window.localStorage['pn_reg_id'] : window.localStorage['pn_reg_id_2'],
        version_number: KTConstant.APP_VERSION,
        device_model: device_model,
        device_uuid: device_uuid,
        mobile_os_version: mobile_os_version
      };
      var url=$rootScope.url + '/v1/login';
      console.log("Url", url);
      var result=WebService.makeServiceCall(url,params, $rootScope.POST);
      result.then(function(response){
        console.log('Result '+JSON.stringify(response));
        console.log("Response", response);
        if (response.data && (response.data.status == 200)) {
          console.log("Success", response.data);
          window.localStorage['token'] = response.data.token;
          window.localStorage['user_email'] = params.email;
          $location.path("/dashboard");
        } else {
          console.log("error");
          WebService.showAlert("Invalid email or password");
          $location.path("/signIn");
        }
      },function(response) {
        WebService.showAlert('json data'+JSON.stringify(response));
      });
    }
  };
})
;
kangaroo.controller('centerCodeVerifiedController', function centerCodeVerifiedController($scope, $http, $rootScope, $location, login,WebService,LocalStore) {
  $scope.data={};
  $scope.data.centercode='';
  $scope.centerCodeVerified = function(data) {
    if(data.centercode==''||data.centercode==undefined){
      WebService.showAlert("Please enter your Center code");
    }else{
      var params={center_code:data.centercode};
      var url=$rootScope.url + '/v1/center_code_verified';
      var result=WebService.makeServiceCall(url,params, $rootScope.POST);
      result.then(function(response){
        if (response.status == 200) {
          window.localStorage['cente_name'] = response.data.center.name;
          window.localStorage['cente_id'] = response.data.center.id;
          window.localStorage['center_code'] = response.data.center.center_code;
          $location.path("/signUp");
        } else if (response.status == 201) {
          WebService.showAlert(response.data);
        }else {
          WebService.showAlert("Problem in Center code verification");
        }
      },function(response) {
        WebService.showAlert(''+JSON.stringify(response));
      });
    }
  };
});

/*
 * Signup controler to perform the SignUp Api opration and Validations.
 */
kangaroo.controller('signUpController', function signUpController($scope, $http, $rootScope, $location, WebService,LocalStore, $cordovaImagePicker, $ionicPlatform, $cordovaContacts) {
  $scope.collection = {
    selectedImage : ''
  };
  $ionicPlatform.ready(function() {
    window.localStorage['base64']='';
    $scope.getImageSaveContact = function() {
      var options = {
        maximumImagesCount: 1, // Max number of selected images, I'm
        // using only one for this example
        width: 200,
        height: 200,
        quality: 50            // Higher is better
      };
      $cordovaImagePicker.getPictures(options).then(function (results) {
        for (var i = 0; i < results.length; i++) {
          $scope.collection.selectedImage = results[i];
          var extensions=  results[i].split('.');
          window.plugins.Base64.encodeFile($scope.collection.selectedImage, function(base64){
            window.localStorage['base64']=base64.replace("*",extensions[extensions.length-1]);
            // // hit Api to check api Img
            // var params= {"image":window.localStorage['base64']};
            // alert("Image :"+JSON.stringify(params));
            // var url="http://192.168.0.158:1879/image";
            // var result=WebService.makeServiceCall(url,params,$rootScope.POST);
            // result.then(function(response){
            // alert("responce : "+JSON.stringify(response))
            // },function(response) {
            // WebService.showAlert(''+JSON.stringify(response));
            // });
            //
            $scope.parentImage=base64;
            $scope.$apply();
          });
        }
      }, function(error) {
        console.log('Error: ' + JSON.stringify(error));
      });
    };
    $scope.data={};
    $scope.data.name='';
    $scope.data.phone='';
    $scope.data.address1='';
    $scope.data.city='';
    $scope.data.state='';
    $scope.data.zip='';
    $scope.data.email='';
    $scope.data.password='';
    $scope.data.confirm_password='';
    $scope.data.checkin_status='';
    $scope.data.terms_conditions='';
    $scope.SignUp = function(data) {
      if(data.name==''||data.name==undefined){
        WebService.showAlert("Please enter Name");
      }else if(data.phone==''||data.phone==undefined){
        WebService.showAlert("Please enter phone");
      }else if(data.address1==''||data.address1==undefined){
        WebService.showAlert("Please enter Address");
      }else if(data.city==''||data.city==undefined){
        WebService.showAlert("Please enter City Name");
      }else if(data.state==''||data.state==undefined){
        WebService.showAlert("Please enter State Name");
      }else if(data.zip==''||data.zip==undefined){
        WebService.showAlert("Please enter Zip code");
      }else if(data.email==''||data.email==undefined){
        WebService.showAlert("Please enter Email");
      }else if(!(/^([\w]+(?:\.[\w]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/.test(data.email)))
      { 	WebService.showAlert("Please enter valid Email");
      } else if(data.password==''||data.password==undefined){
        WebService.showAlert("Please enter Password");
      }else if(data.confirm_password==''||data.confirm_password==undefined){
        WebService.showAlert("Please enter Confirm password");
      } else if(data.password.length<6){
        WebService.showAlert("Password should be at least 6 characters");
      }else if(data.password!=data.confirm_password){
        WebService.showAlert("Confirm Passwords don't match");
      } else if(data.checkin_status==''||data.checkin_status==undefined){
        WebService.showAlert("Please enter Checkin/CheckOut pin");
      }else if(!data.terms_conditions){
        WebService.showAlert("Please agree to Terms and conditions");
      }else
      {	  var base64String = window.localStorage['base64'];
        var centerId = window.localStorage['cente_id'];
        var params={parent: {center_id : centerId, image: base64String ,username: data.name, email: data.email, contact_no: data.phone, address1: data.address1, address2: data.address2, city:data.city, state: data.state, zip: data.zip, password : data.password, password_confirmation :data.confirm_password, pin:data.checkin_status } };
        console.log('params '+JSON.stringify(params));
        var url=$rootScope.url + '/v1/parent-sign-up';
        var result=WebService.makeServiceCall(url,params, $rootScope.POST);
        result.then(function(response){
          if (response.status == 200) {
            WebService.showAlert("We have sent you verification email to activate your account");
            $location.path("/signIn");
          } else {
            WebService.showAlert("Problem in User signUp");
          }
        },function(response) {
          WebService.showAlert(''+JSON.stringify(response));
        });
      }
    };
  });
});

/*
 * Edit Profile of user controler to perform the Edit Profile Api opration and
 * Validations.
 */
kangaroo.controller('editprofileController', function editprofileController($scope, $http, $rootScope, $location, WebService,LocalStore, $cordovaImagePicker, $ionicPlatform, $cordovaContacts)
  {
    $scope.collection = {
      selectedImage : ''
    };
    // $scope.parentImage='/img/uploadimage.png';
    $ionicPlatform.ready(function() {
      window.localStorage['base64']='';
      $scope.getImage = function() {
        // Image picker will load images according to these settings
        var options = {
          maximumImagesCount: 1, // Max number of selected images, I'm
          // using only one for this example
          width: 200,
          height: 200,
          quality: 50            // Higher is better
        };
        $cordovaImagePicker.getPictures(options).then(function (results) {
          // Loop through acquired images
          for (var i = 0; i < results.length; i++) {
            $scope.collection.selectedImage = results[i];
            var extensions=  results[i].split('.');
            window.plugins.Base64.encodeFile($scope.collection.selectedImage, function(base64){
              window.localStorage['base64']=base64.replace("*",extensions[extensions.length-1]);

              $scope.parentImage=base64;
              $scope.$apply();
            });
          }
        }, function(error) {
          console.log('Error: ' + JSON.stringify(error));
        });
      };
      var ParentInfo=$rootScope.parentInfo;
      $scope.data={};
      $scope.parentName=ParentInfo.username;
      $scope.parentAddress=ParentInfo.address;
      $scope.parentImage=ParentInfo.image;
      $scope.data.name=ParentInfo.username;
      $scope.data.phone=ParentInfo.contact_no;
      $scope.data.address1=ParentInfo.address1;
      $scope.data.address2=ParentInfo.address2;
      $scope.data.city=ParentInfo.city;
      $scope.data.state=ParentInfo.state;
      $scope.data.country=ParentInfo.country;
      $scope.data.zip=ParentInfo.zip;
      $scope.profileUpdate = function(data) {
        if(data.name==''||data.name==undefined){
          WebService.showAlert("Please enter name");
        }else if(data.phone==''||data.phone==undefined){
          WebService.showAlert("Please enter phone number");
        }else if(data.address1==''||data.address1==undefined){
          WebService.showAlert("Please enter first address");
        }else if(data.city==''||data.city==undefined){
          WebService.showAlert("Please enter city name");
        }else if(data.state==''||data.state==undefined){
          WebService.showAlert("Please enter State name");
        }else if(data.zip==''||data.zip==undefined){
          WebService.showAlert("Please enter zip code");
        }else{
          var params={parent: {image: window.localStorage['base64'],username: data.name,contact_no: data.phone,address1: data.address1,address2: data.address2,city:data.city ,state: data.state,zip: data.zip} };
          var url=$rootScope.url + '/v1/edit_profile';
          var token = window.localStorage['token'];
          var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
          result.then(function(response){
            if (response.status == 200) {
              WebService.showAlert("Profile updated successfully");
            } else {
              WebService.showAlert("Problem in Profile updating");
            }
            $location.path("/editProfile");
          },function(response) {
            WebService.showAlert(''+JSON.stringify(response));
          });
        }
      };
    });
  });

/*
 * Check IN/Out of user to perform the Api opration.
 */
kangaroo.controller('CheckInOutController', function CheckInOutController($scope, $http, $rootScope, $location,WebService,LocalStore) {
  $scope.showErrorMessage = false;
  $scope.check_in = function() {
    window.localStorage['checked_in'] = false;
    $location.path("/checkInPin");
  };
  $scope.check_out = function() {
    window.localStorage['checked_in'] = true;
    $location.path("/checkInPin");
  };
});

/*
 * settingController of user setting page oprations.
 */
kangaroo.controller('settingController', function settingController($scope, $rootScope, $location, WebService, LocalStore) {
  var params={};
  var url=$rootScope.url + '/v1/settings';
  var token = window.localStorage['token'];
  var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
  result.then(function(response){
    console.log("Response", response);
    if (response.status == 200) {
      // Api result.
      if(response.data.ref_parent && response.data.ref_parent.length>0){
        console.log("yes");
        $scope.hide_Child=true;
      }else{
        console.log("no");

        $scope.hide_Child=false;
      }
    } else {
      WebService.showAlert("Problem in page");
    }

  },function(response) {
    console.log(''+JSON.stringify(response));
  });
  $scope.showErrorMessage = false;
  $scope.user_name=window.localStorage['user_name'];
  $scope.user_email=window.localStorage['user_email'];
  $scope.parentImage=window.localStorage['user_Image'];
  $scope.check_in = function() {
    window.localStorage['checked_in'] = false;
    $location.path("/checkInPin");
  };
  $scope.check_out = function() {
    window.localStorage['checked_in'] = true;
    $location.path("/checkInPin");
  };
});
/*
 * Check IN PIN of user to perform the Api opration and Validation.
 */
kangaroo.controller('CheckInPinController', function CheckInPinController($scope, $http, $rootScope, $location, WebService,$location,CheckInService,CheckOutService,LocalStore) {
  $scope.data={};
  $scope.data.pin='';
  $scope.checkIn_Confirm = function(data) {
    if(data.pin==''||data.pin==undefined){
      WebService.showAlert("Please enter your Pin");
    }else{
      var params={pin:data.pin,checked_in: window.localStorage['checked_in'] };
      var url=$rootScope.url + '/v1/checkin-list';
      var token = window.localStorage['token'];
      console.log("Params", params);
      var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
      result.then(function(response){
        console.log("Response", response);
        if (response.status == 200) {
          console.log("Checked In", window.localStorage['checked_in']);
          if(window.localStorage['checked_in'] == "true"){
            CheckInService.addCheckInList(response.data.children);
            $location.path("/checkOut");
          }else{
            CheckInService.addCheckInList(response.data.children);
            $location.path("/checkIn");
          }
        }else if (response.status == 201) {
          WebService.showAlert(response.data);
        } else {
          WebService.showAlert("Invalid Pin");
        }
      },function(response) {
        console.log(''+JSON.stringify(response));
      });
    }
  };
});

/*
 * Check IN of user to perform the Api opration.
 */
kangaroo.controller('CheckInController', function CheckInController($scope,$ionicPopup, $http, $rootScope, $location, WebService,$location,CheckInService) {
  $scope.checkInList=CheckInService.getCheckInList();
  console.log("Checkin List", $scope.checkInList);
  $scope.check_in_yes = function(child,index) {
    var params={center_id:child.center_id,parent_id:child.parent_id, child_id:child.id, checkin:'yes', reason:'' };
    var url=$rootScope.url + '/v1/checkin_yesno';
    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
    result.then(function(response){
      if (response.status == 200) {
        WebService.showAlert('Check in request sent successfully');
        // WebService.showAlert('Sucessfully CheckedIn');
        $scope.checkInList[index].checkin=true;
        $scope.$apply();
      } else {
        WebService.showAlert('Problem in CheckIn');
      }
    },function(response) {
      console.log(''+JSON.stringify(response));
    });
  };

  $scope.submit = function(child,Region,index) {
    var params={center_id:child.center_id,parent_id:child.parent_id, child_id:child.id, checkin:'no', reason:Region };
    var url=$rootScope.url + '/v1/checkin_yesno';
    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
    result.then(function(response){
      if (response.status == 200) {
        WebService.showAlert('Sucessfully Submitted');
        $scope.checkInList[index].checkin=true;
        $scope.$apply();
      }else if (response.status == 201) {
        WebService.showAlert(response.data);
      } else {
        WebService.showAlert('Failed to submit ');
      }
    },function(response) {
      console.log(''+JSON.stringify(response));
    });

  };
  $scope.btn_done = function(child) {
    $location.path("/checkInOut");
  };
});

kangaroo.controller('CheckOutController', function CheckOutController($scope, $http,$ionicPopup, $rootScope, $location, WebService,$location,CheckInService) {
  $scope.checkInList=CheckInService.getCheckInList();
  $scope.check_out_yes = function(child,index) {
    var params={center_id:child.center_id,parent_id:child.parent_id, child_id:child.id, checkin:'yes', reason:'' };
    var url=$rootScope.url + '/v1/checkout_yes';
    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
    result.then(function(response){
      if (response.status == 200) {
        $scope.checkInList[index].checkin=false;
        $scope.$apply();
        // WebService.showAlert('Sucessfully Checked Out');
        WebService.showAlert('Check out request sent successfully');
      } else {
        WebService.showAlert('Failed to checkout');
      }
    },function(response) {
      console.log(''+JSON.stringify(response));
    });
  };
  $scope.btn_done = function(child) {
    $location.path("/checkInOut");
  };
});
kangaroo.controller('changePasswordController', function changePasswordController($scope, $http, $rootScope, $location, WebService,$location,CheckInService) {
  $scope.data={};
  $scope.changePassword = function(data) {
    if(data.new_password==''||data.new_password==undefined){
      WebService.showAlert("Please enter new password");
    }else if(data.confirm_password==''||data.confirm_password==undefined){
      WebService.showAlert("Please enter confirm password");
    }else if(data.new_password!=data.confirm_password){
      WebService.showAlert("Confirm passwords don't match");
    }else{
      $scope.changePassword = function(data) {
        var params={"parent":{"password":data.new_password ,
          "confirm_password":data.confirm_password}
        };
        var url=$rootScope.url + '/v1/change_password';
        var token = window.localStorage['token'];
        var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
        result.then(function(response){
          if (response.status == 200) {
            WebService.showAlert('Password updated successfully');
            $location.path("/settings");
          } else {
            WebService.showAlert('Password not updated');
          }
        },function(response) {
          console.log(''+JSON.stringify(response));
        });
      };
    }
  }
});

kangaroo.controller('relationShipController', function relationShipController($scope, $http, $rootScope, $location, WebService,$location,CheckInService) {

  $scope.data = {
    parent_invitation: {
      gallery: true,
      messages: true,
      calendar: true,
      invite_parent_email: ""
    },
    child_privilege_attributes: []
  };
  $scope.children = [];

  var params = {};
  var url = $rootScope.url + '/v1/child_list';
  var token = window.localStorage['token'];
  var result = WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);

  result.then(function(response){
    if (response.status == 200) {
      $scope.children =response.data.children;
      for (var i=0; i<$scope.children.length; i++)
        $scope.data.child_privilege_attributes.push({
          child_id: $scope.children[i].id,
          notes: true,
          checkin: true,
          billing: true
        });
    }else if(response.status == 201){
      $scope.message = response.data;
    }
  },function(response) {
    console.log(''+JSON.stringify(response));
  });

  $scope.btnRelationship = function(data) {
    if(data.parent_invitation.invite_parent_email==''||data.parent_invitation.invite_parent_email==undefined){
      WebService.showAlert("Please enter email of person you would like to add");
    }else if(!(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(data.parent_invitation.invite_parent_email)))
    { 	WebService.showAlert("Please enter valid email of person you would like to add");
    }
    else{
      var params = {
        parent_invitation: $scope.data.parent_invitation,
        child_privilege_attributes: JSON.stringify($scope.data.child_privilege_attributes)
      };
      var url=$rootScope.url + '/v1/relataionship_invite';
      var token = window.localStorage['token'];
      var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
      result.then(function(response){
        if (response.status == 200) {
          WebService.showAlert('Invitation Sent to Guardian successfully');
          $location.path("/settings");
        }else if (response.status == 201) {
          WebService.showAlert(response.data);
          $location.path("/settings");
        } else {
          WebService.showAlert('Invitation not sent to Guardian');
        }
      },function(response) {
        console.log(''+JSON.stringify(response));
      });
    }
  };
});

kangaroo.controller('SetPrivilegeController', function SetPrivilegeController($scope, $http, $rootScope, $location, WebService,$location,CheckInService) {

  var params={"type":"refp"};
  var url=$rootScope.url + '/v1/ref_parent_list';
  var token = window.localStorage['token'];
  var result=WebService.makeServiceCallHeader(url, params, $rootScope.POST, token);

  result.then(function(response){
    if (response.status == 200) {
      if(response.data.refparent.length){
        $scope.guardians = response.data.refparent;
      } else {
        $scope.showEmptyText = true;
      }
    }
  },function(response) {
    console.error(''+JSON.stringify(response));
  });

  $scope.onTapGuardian = function(guardian){
    $rootScope.guardian = guardian;
    $location.path("/setPrivilegeDetail");
  }
});

kangaroo.controller('SetPrivilegeDetailController', function SetPrivilegeDetailController($scope, $http, $rootScope, $location, WebService,$location,CheckInService) {

  $scope.onChange = function(guardian, privilege, value, child_id) {
    var params = {guardian: guardian, privilege: privilege, value: value, child_id: child_id};
    var url = $rootScope.url + '/v1/set_privilege';
    var token = window.localStorage['token'];
    var result = WebService.makeServiceCallHeader(url, params, $rootScope.POST, token);
    result.then(function(response) {
      if (response.status == 200) {
        // WebService.showAlert('Guardian Privileges Updated Sucessfully');
      } else {
        WebService.showAlert('Guardian Privileges not updated');
      }
    }, function(response) {
      console.error('There was an error saving the settings.');
    });
  };
});

/*
 * DashBord page controler to perform the Api opration and Validation.
 */
kangaroo.controller('dashbordController', function dashbordController($scope, $http, $rootScope,$templateCache,$window, $location, profile, login,LocalStore,WebService,AllEventService) {
  var params={};
  $scope.data = {};

  $scope.data.value=window.localStorage['user_name'];
  // alert($scope.data.value);
  var url=$rootScope.url + '/v1/parent_profile';
  var token = window.localStorage['token'];
  var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
  result.then(function(response){
    if (response.status == 200) {

      // window.localStorage.getItem['parent_profile_data']=response.data;
      window.localStorage['parent_id'] = response.data.parent_id;
      window.localStorage['center_id'] = response.data.center_id;//.$oid;
      window.localStorage['center_name'] = response.data.center_name;
      // alert("Center: "+window.localStorage['center_id']+" "+"Parent
      // Id:"+window.localStorage['parent_id']);
      window.localStorage['user_email'] = response.data.email;
      window.localStorage['user_name'] = response.data.username;
      window.localStorage['user_address'] = response.data.address;
      window.localStorage['user_Image'] = response.data.image;
      $scope.name = response.data.username;
      $scope.address = response.data.address;
      $scope.userImage = response.data.image;
      // $scope.name=window.localStorage['user_name'];
      // $scope.address=window.localStorage['user_address'];
      // $scope.userImage=window.localStorage['user_Image'];


      // Menu visibilte according to user.
      $scope.messages=response.data.messages;
      $scope.check_inout=response.data.check_inout;
      $scope.assessment=response.data.assessment;

      $scope.calendar=response.data.calendar;
      $scope.billing=response.data.billing;
      $scope.gallery=response.data.gallery;
    } else {
      WebService.showAlert("Invalid request");
    }

  },function(response) {
    console.log(''+JSON.stringify(response));
  });

  $scope.logout = function() {
    var pn =  window.localStorage['pn_reg_id'];
    var user_email = window.localStorage['user_email'];
    login.logout(window.localStorage['token']).success(function(data) {
      localStorage.clear();
      window.localStorage['pn_reg_id'] = pn;
      window.localStorage['user_email'] = user_email;
      $location.path("/");
      // for(var i=0;i<$window.history.length;i++){
      // $window.history.back();
      // }
    }).error(function(data, status, headers, config) {
      localStorage.clear();
      window.localStorage['pn_reg_id'] = pn;
      window.localStorage['user_email'] = user_email;
      // for(var i=0;i<$window.history.length;i++){
      // $window.history.back();
      // }
      $location.path("/");
    });
  };

});


kangaroo.controller('billingMenuController', function billingMenuController($scope, $http, $rootScope, $location, contactUs,WebService) {
  $scope.achInformation=function(){
    $location.path("/billingACH");
  };
  $scope.cardInformation=function(){
    var params={};
    var url=$rootScope.url + '/v1/new_cardinfo';
    //	  var url='http://kangarootime.us/api/v1/new_cardinfo';
    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
    result.then(function(response){
      console.log(''+JSON.stringify(response));
      if (response.status == 200) {
        //	      		alert(JSON.stringify(response));
        if(response.data.hasOwnProperty('card_hash')){
          $location.path("/billing");
          // /billingMenus
          window.localStorage.getItem['user_card_hash']=response.data.card_hash;
        }else if(response.data.hasOwnProperty('card_info')){
          $location.path("/cardInformation");
          window.localStorage.getItem['user_card_info']=response.data.card_info;
        }
      }
    },function(response) {
      alert("error"+JSON.stringify(response));
      console.log(''+JSON.stringify(response));
    });
  };
  $scope.amountPaid=function(){
    $location.path("/paidAmount");
  };
  $scope.amountDue=function(){
    $location.path("/dueAmount");
  };
  $scope.Report=function(){
    $location.path("/listChildReport");
  };
});


kangaroo.controller('billingACHController', function billingACHController($scope,$sce,$http,$rootScope,$location, contactUs,WebService,KTConstant) {
  var params={};
  // window.localStorage['parent_id'] = response.data.parent_id;
  // window.localStorage['center_id'] = response.data.center_id.$oid;
  // alert(KTConstant.BASE_URL+'/ach_card_new?center_id='+window.localStorage['center_id']+'&parent_id='+window.localStorage['parent_id']);
  $scope.customUrl = $sce.trustAsResourceUrl(KTConstant.BASE_URL+'/ach_card_new?center_id='+window.localStorage['center_id']+'&parent_id='+window.localStorage['parent_id']+'&staging=true');
  console.log('$scope.customUrl'+$scope.customUrl);
  // var url=$rootScope.url + '/v1/ach_details';
  // var token = window.localStorage['token'];
  // var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
  // result.then(function(response){
  // if (response.status == 200) {
  // var hash_value=response.data.card_hash.hash;
  // var seed_value=response.data.card_hash.seed;
  // var net_amt=response.data.card_hash.net_amt;
  // $scope.customUrl =
  // $sce.trustAsResourceUrl(KTConstant.BASE_URL+'/ach_card_new?center_id=56403a2e69702d4c15000000&parent_id=56403c1e69702d4c15010000');
  // }
  // },function(response) {
  // console.log(''+JSON.stringify(response));
  // });
  window.checkIframeUrl=function(curentUrl){
    // alert("Current ACh Page: "+curentUrl);
  };
  // $scope.customUrl =
  // $sce.trustAsResourceUrl('https://sandbox.axiaepay.com/interface/epayform/_vf7zTwe2eVr2XnhMyJCLWke600f0595/?UMcommand=check:sale&amp;UMamount=4.0&amp;UMinvoice=12345&amp;UMhash=s/1447756951.1788719/85287e86d798fbd612a537e23a620b2c9bc4ab8d/n&amp;UMechofields=all&amp;UMsaveCard=true&amp;UMredirApproved=http://testing.kangarootime.com/ach_save&amp;UMredirDeclined=http://testing.kangarootime.com/ach_save');
});
kangaroo.controller('cardInfoController', function cardInfoController($scope, $http, $rootScope, $location, contactUs,WebService) {
  //	alert("catd");
  var user_info =	window.localStorage.getItem['user_card_info'];
  $scope.parentImage = window.localStorage['user_Image'];
  $scope.parent_name=user_info.parent_name;
  $scope.center_name=user_info.center_name;
  $scope.card_no=user_info.card_no;
  $scope.card_type=user_info.card_type;
});

kangaroo.controller('listChildReportController', function listChildReportController($scope, $http, $rootScope, $location, contactUs,WebService) {
  var params={};
  var url=$rootScope.url + '/v1/child_list';
  var token = window.localStorage['token'];
  var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
  result.then(function(response){
    if (response.status == 200) {

      // $location.path("/billingMenus");

      $scope.listChild =response.data.children;
    }
    else if(response.status == 201){
      $scope.noData=true;
      $scope.message=response.data;
    }
  },function(response) {
    console.log(''+JSON.stringify(response));

  });
  $scope.clickChild=function(child){
    window.localStorage.getItem['Selected_Child']=child;
    $location.path("/ReportView");
  }
});

kangaroo.controller('reportViewController', function reportViewController($scope, $http, $rootScope, $location, contactUs,WebService) {
  var child=window.localStorage.getItem['Selected_Child'];
  var params={child_id:child.id};
  // var params={child_id:"5656bc3d69702d0d64010000"};
  var url=$rootScope.url + '/v1/all_report';
  var token = window.localStorage['token'];
  // var token = "d11097e3c1cc9a24076ed407064510ee";
  var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
  result.then(function(response){
    if (response.status == 200) {
      $scope.Reports =	response.data.reports;
    }else if(response.status == 201){
      $scope.no_detail_Message="No Transaction Found";
      $scope.hideDetailView=true;
    }
  },function(response) {
    console.log(''+JSON.stringify(response));
  });
});


kangaroo.controller('listChildController', function listChildController($scope, $http, $rootScope, $location, contactUs,WebService) {
  var params={};
  var url=$rootScope.url + '/v1/child_list';
  var token = window.localStorage['token'];
  var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
  result.then(function(response){
    if (response.status == 200) {
      $scope.listChild =response.data.children;
    }
    else if(response.status == 201){
      $scope.noData=true;
      $scope.message=response.data;
    }
  },function(response) {
    console.log(''+JSON.stringify(response));

  });
  $scope.clickChild=function(child){
    window.localStorage.getItem['Selected_Child']=child;
    $location.path("/dueAmount");

  }
});

kangaroo.controller('listAssessmentsChilds', function listAssessmentsChilds($scope, $http, $rootScope, $location, contactUs,WebService) {
  var params={};
  var url=$rootScope.url + '/v1/child_list';
  var token = window.localStorage['token'];
  var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
  result.then(function(response){
    if (response.status == 200) {
      $scope.listChild =response.data.children;
      // alert(JSON.stringify(response.data.children));
    }
    else if(response.status == 201){
      // alert("201"+JSON.stringify(response));
      // alert("201"+JSON.stringify(response.data.children));
      $scope.noData=true;
      $scope.message=response.data;
    }
  },function(response) {
    // alert("error"+JSON.stringify(response.data.children));
    console.log(''+JSON.stringify(response));

  });
  $scope.clickChild=function(child){
    window.localStorage.getItem['Selected_Child']=child;
    $location.path("/assessmentList");

  }
});

kangaroo.controller('AssessmentsList', function AssessmentsList($scope, $http, $rootScope, $location, contactUs,WebService) {

  $scope.assignList = [];

  $scope.showAssessment=function(assessment){
    window.localStorage.getItem['Selected_Assessment']=assessment;
    $location.path("/assessmentDetail");
  }

  var child=window.localStorage.getItem['Selected_Child'];
  var params="";
  var url=$rootScope.url + '/v1/assessments_list?child_id='+child.id;
  var token = window.localStorage['token'];
  var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);

  result.then(function(response){

    if (response.status == 200) {
      var myList=[];
      var str;
      var results = [];

      $scope.noDataToShow=false;

      for (var i = 0; i < response.data.assessment.length; i++) {
        var assign = {};
        assign.id = response.data.assessment[i].id;
        assign.child_name = response.data.assessment[i].child_name;
        assign.date = response.data.assessment[i].date;
        str = response.data.assessment[i].description.replace(/#|&|13|;|,|_/g,'');

        assign.description = str;
        myList.push(assign);
      }
      $scope.assignList=myList;
    }else{
      $scope.noDataToShow=true;
    }
  },function(response) {
    console.log(''+JSON.stringify(response));
  });

});



kangaroo.controller('AssessmentDetailController', function AssessmentDetailController($scope, $http, $rootScope, $location, $timeout, $cordovaInAppBrowser, contactUs,WebService) {
  var id= window.localStorage.getItem['Selected_Assessment'].id;
  var child=window.localStorage.getItem['Selected_Child'];
  var str;
  var params="";
  var url=$rootScope.url + '/v1/assessments_details?id='+id;
  var token = window.localStorage['token'];
  var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
  result.then(function(response){
    if (response.status == 200) {
      $scope.noDataToShow=false;
      $scope.assessment =response.data.notes;
      $scope.date =response.data.notes.date;
      $scope.description = response.data.notes.description;
      $timeout(function(){
        $('.naming-convension a').on('click', function(ev){
          var link = $(ev.target).attr("href");
          if ($cordovaInAppBrowser) $cordovaInAppBrowser.open(link, '_system', {});
          ev.preventDefault();
        })
      }, 100);
    } else if(response.status == 201){
      $scope.noDataToShow=true;
    }else{
      $scope.noDataToShow=true;
    }
  },function(response) {
    console.log(''+JSON.stringify(response));

  });

});

kangaroo.controller('duoAmountController', function duoAmountController($scope, $http, $rootScope, $location, $utils, contactUs, WebService) {

  var child=window.localStorage.getItem['Selected_Child'];
  $scope.data = {};
  var params={};
  var url=$rootScope.url + '/v1/due_amount';
  var token = window.localStorage['token'];

  var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);

  result.then(function(response){

    $scope.child=child;
    if (response.status == 200) {
      $scope.child_id =	response.data.card_info.id;
      $scope.center_name =	response.data.card_info.center_name;

      var valueInfo=response.data.card_info.balance.split('$');
      $scope.data.anyAmount=0.00;
      $scope.data.previous_balance = $utils.formatCurrencyWithCommas(response.data.invoice.previous_balance);
      $scope.data.previous_payments = $utils.formatCurrencyWithCommas(response.data.invoice.previous_paid);
      $scope.data.balance_forward = $utils.formatCurrencyWithCommas(response.data.invoice.balance_forward);
      $scope.data.new_charges = $utils.formatCurrencyWithCommas(response.data.invoice.total);
      $scope.data.recent_payments = $utils.formatCurrencyWithCommas(response.data.invoice.total_paid);
      $scope.data.cb_ad_caption = response.data.invoice.balance_due_label;
      $scope.data.cb_ad = $utils.formatCurrencyWithCommas(response.data.invoice.balance_due);

      if(response.data.card_info.card_info==false){
        $scope.PayBtnCard=true;
      }else{
        $scope.PayBtnCard=false;
      }
      if(response.data.card_info.ach_info==false){
        $scope.PayBtnAch=true;
      }else{
        $scope.PayBtnAch=false;
      }
    }else if(response.status == 201){
      $scope.noData = true;
      $scope.no_Amount_Message = "No Due Amount Details Found";
      $scope.hidePayBtn = true;
    }

  },function(response) {
    $scope.hidePayBtn=true;
    console.log(''+JSON.stringify(response));
  });

  $scope.payNowAch=function(data){

    if (isNaN(parseFloat(data.anyAmount))){
      WebService.showAlert("Payment Amount is invalid.");
      return;
    }

    var params="";
    var url=$rootScope.url +'/v1/pay_now?amt=$'+data.anyAmount+'&type=ACH';
    console.log(''+url);

    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);

    result.then(function(response){
      if (response.status == 200) {
        WebService.showAlert('Your Payment has been submitted successfully');
      } else {
        WebService.showAlert("Transaction failed. Please try again!!!");
      }

      $location.path('/billingMenus');
    },function(response) {
      console.log(''+JSON.stringify(response));
    });

  }

  $scope.payNowCard=function(data){

    if (isNaN(parseFloat(data.anyAmount))){
      WebService.showAlert("Payment Amount is invalid.");
      return;
    }

    var params="";
    var url=$rootScope.url +'/v1/pay_now?amt='+data.anyAmount+'&type=CARD';

    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);

    result.then(function(response){
      if (response.status == 200) {
        WebService.showAlert('Your Payment has been submitted successfully');
      } else {
        WebService.showAlert("Transaction failed. Please try again!!!");
      }

      $location.path('/billingMenus');
    },function(response) {
      console.log(''+JSON.stringify(response));
    });
  }
});

kangaroo.controller('paidAmountController', function paidAmountController($scope, $http, $rootScope, $location, $utils, $cordovaInAppBrowser, $timeout, contactUs,WebService) {
  var params={};
  var url=$rootScope.url + '/v1/paid_amount';
  var token = window.localStorage['token'];

  $scope.invoiceData = [];

  var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
  result.then(function(response){
    if (response.status == 200) {
      for (var i=0; i<response.invoice.length; i++){
        var item = {
          previous_balance: $utils.formatCurrencyWithCommas(response.invoice[i].previous_balance),
          previous_payments: $utils.formatCurrencyWithCommas(response.invoice[i].previous_paid),
          balance_forward: $utils.formatCurrencyWithCommas(response.invoice[i].balance_forward),
          new_charges: $utils.formatCurrencyWithCommas(response.invoice[i].total),
          new_balance: $utils.formatCurrencyWithCommas(response.invoice[i].balance),
          date: $utils.getDateString(response.invoice[i].date),
          number: response.invoice[i].number
        }
        $scope.invoiceData.push(item);
      }
    }
    else if(response.status == 201){
      $scope.noData=true;
      $scope.message=response.data;
    }

    $timeout(function(){
      $('.invoice-wrapper a').on('click', function(ev){
        var link = $(ev.target).attr("href");
        if ($cordovaInAppBrowser) $cordovaInAppBrowser.open(link, '_system', {});
        ev.preventDefault();
      })
    }, 100);
  },function(response) {
    console.log(''+JSON.stringify(response));
  });
});

kangaroo.controller('billingController', function billingController($scope, $sce, $http, $rootScope, $location, contactUs,WebService,KTConstant) {
  $scope.data={};
  $scope.customUrl = $sce.trustAsResourceUrl(KTConstant.BASE_URL+'/axia-card-new?center_id='+window.localStorage['center_id']+'&parent_id='+window.localStorage['parent_id']+'&staging=true');
  console.log('$scope.customUrlaxis card - ' + $scope.customUrl);

  window.checkIframeUrl=function(curentUrl){
  };
});

kangaroo.controller('contactUsController', function contactUsController($scope, $http, $rootScope, $location, contactUs) {
  $scope.showErrorMessage = false;
  $scope.submit = function() {
    if (!(/^([\w]+(?:\.[\w]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/.test($scope.email))) {
      $scope.showErrorMessage = true;
      // alert("asdf");
    } else {
      $scope.showErrorMessage = false;
      contactUs.contact($scope.name, $scope.email, $scope.phone, $scope.info).success(function(data) {
        WebService.showAlert("Mail Sucessfully Sent");
      });
    }
  };
});

kangaroo.controller('calendarController', function calendarController($scope, $http, $rootScope, $location, contactUs,WebService,AllEventService) {
  'use strict';
  $scope.changeMode = function (mode) {
    $scope.mode = mode;
  };

  $scope.today = function () {
    $scope.currentDate = new Date();
  };

  $scope.isToday = function () {
    var today = new Date(),
      currentCalendarDate = new Date($scope.currentDate);

    today.setHours(0, 0, 0, 0);
    currentCalendarDate.setHours(0, 0, 0, 0);
    return today.getTime() === currentCalendarDate.getTime();
  };

  $scope.loadEvents = function () {
    var params={type:'event'};
    var url=$rootScope.url + '/v1/list_event';
    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
    result.then(function(response){
      if (response.status == 200) {
        AllEventService.addAllEvent(response.data.event);
        $scope.eventSource = createRandomEvents(response.data.event);
      } else	if (response.status == 201) {
        WebService.showAlert(response.data);
      }else {
        WebService.showAlert('Problem in Loading calendar events');
      }
    },function(response) {
      console.log(''+JSON.stringify(response));
    });
  };
  $scope.onEventSelected = function (event) {
    $scope.event = event;
  };
  function createRandomEvents(allEvents) {
    var events = [];
    for (var i = 0; i < allEvents.length; i += 1) {
      var month=allEvents[i].starts_at.split('/')[0]-1;
      var day=allEvents[i].starts_at.split('/')[1];
      var year=allEvents[i].starts_at.split('/')[2];

      var startHours=allEvents[i].starts_time.split(':')[0];
      var startMints=allEvents[i].starts_time.split(':')[1].split(' ')[0];

      var date = new Date();
      var startTime;
      var endTime;
      startTime =  new Date(year, month, day, parseInt(startHours), parseInt(startMints));
      endTime = new Date(year, month, day, parseInt(startHours), parseInt(startMints) );
      events.push({
        title: allEvents[i].title,
        startTime: startTime,
        endTime: endTime,
        id:allEvents[i].id,
        allDay: false
      });
    }
    return events;
  };
  $scope.eventSelected = function () {
  };
});

kangaroo.controller('monthCalendarController', function monthCalendarController($scope, $http, $rootScope,$filter, $location,WebService,CalendarEventService) {
  $scope.eventSelected = function(event) {
    var params={id:event.event.id};
    var url=$rootScope.url + '/v1/show_event';
    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
    result.then(function(response){
      if (response.status == 200) {
        CalendarEventService.addEvent(response.data.event);
        $location.path("/calendarEvent");
      } else {
        WebService.showAlert('Problem in Loading');
      }
    },function(response) {
      console.log(''+JSON.stringify(response));
    });
  };
  $scope.selectDate = function(date) {
    $scope.selectedDate=date.date;
    $scope.showEventsDiv=true;
  };
});
kangaroo.controller('calendarEventController', function calendarEventController($scope, $rootScope, $location,CalendarEventService) {
  var str;
  var Event=CalendarEventService.getEvent();
  var Start_date=  Event.starts_at.split('/');
  $scope.eventDate=Start_date[1];
  $scope.eventTitle=Event.title;
  $scope.eventCenter=window.localStorage['center_name'];
  $scope.eventStarts_at=Event.starts_at;
  $scope.eventStarts_time=Event.starts_time;
  str = Event.description.replace(/#|&|13|;|,|_/g,'')
  $scope.eventDescription=str;
  if(Start_date[0]=="1"){
    $scope.eventMonth="Jan";
  }else if(Start_date[0]=="2"){
    $scope.eventMonth="Feb";
  }else if(Start_date[0]=="3"){
    $scope.eventMonth="Mar";
  }else if(Start_date[0]=="4"){
    $scope.eventMonth="Apr";
  }else if(Start_date[0]=="5"){
    $scope.eventMonth="May";
  }else if(Start_date[0]=="6"){
    $scope.eventMonth="Jun";
  }else if(Start_date[0]=="7"){
    $scope.eventMonth="Jul";
  }else if(Start_date[0]=="8"){
    $scope.eventMonth="Aug";
  }else if(Start_date[0]=="9"){
    $scope.eventMonth="Sep";
  }else if(Start_date[0]=="10"){
    $scope.eventMonth="Oct";
  }else if(Start_date[0]=="11"){
    $scope.eventMonth="Nov";
  }else if(Start_date[0]=="12"){
    $scope.eventMonth="Dec";
  }else{
    $scope.eventMonth=Start_date[0];
  }

});

/*
 * Signup controler to perform the SignUp Api opration and Validations.
 */
kangaroo.controller('CreateChildController', function CreateChildController($scope, $cordovaDatePicker, $filter, $http, $rootScope, $location,WebService,LocalStore, $cordovaImagePicker, $ionicPlatform, $cordovaContacts) {
  $scope.collection = {
    selectedImage : ''
  };
  $ionicPlatform.ready(function() {
    window.localStorage['childbase64']='';
    // ------------------------------------------------------
    var params={};
    var url=$rootScope.url + '/v1/new_child';
    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
    result.then(function(response){
      if (response.status == 200) {
        $scope.AllPlans=response.data.plan;
      }
    },function(response) {
      console.log(''+JSON.stringify(response));
    });
    // -----------------------------------------------------
    $scope.getImageSaveContact = function() {
      // Image picker will load images according to these settings
      var options = {
        maximumImagesCount: 1, // Max number of selected images, I'm
        // using only one for this example
        width: 200,
        height: 200,
        quality: 50            // Higher is better
      };
      $cordovaImagePicker.getPictures(options).then(function (results) {
        // Loop through acquired images
        for (var i = 0; i < results.length; i++) {
          $scope.collection.selectedImage = results[i];
          var extensions=  results[i].split('.');
          window.plugins.Base64.encodeFile($scope.collection.selectedImage, function(base64){
            // alert(base64.replace("*",extensions[extensions.length-1]));
            window.localStorage['childbase64']=base64.replace("*",extensions[extensions.length-1]);
            $scope.parentImage=base64;
            $scope.$apply();
          });
        }
      }, function(error) {
        console.log('Error: ' + JSON.stringify(error));
      });
    };
    $scope.data={};
    $scope.data.First_Name='';
    $scope.data.Middle_Name='';
    $scope.data.Last_Name='';
    $scope.data.Birth_City='';
    $scope.data.Birth_Country='';
    $scope.data.Street_Address='';
    // $scope.data.child_relation='';
    $scope.data.State='';
    $scope.data.zip_code='';
    $scope.data.Country='';
    $scope.data.sex='';
    $scope.data.plan='';
    $scope.data.birthday='';
    var dateSelected='';
    if(dateSelected==''){
      dateSelected= $filter('date')(new Date(), "MM-dd-yyyy");
      $scope.data.birthday=	"Date of Birth *";
    }
    $scope.selectDate = function() {
      var options = {
        date: new Date(dateSelected),
        mode: 'date', // or 'time'
        maxDate: new Date() - 10000,
        allowOldDates: true,
        allowFutureDates: false,
        doneButtonLabel: 'DONE',
        doneButtonColor: '#F2F3F4',
        cancelButtonLabel: 'CANCEL',
        cancelButtonColor: '#000000'
      };

      $cordovaDatePicker.show(options).then(function(date){
        dateSelected =$filter('date')(date, "MM-dd-yyyy");
        $scope.data.birthday= $filter('date')(date, "MM-dd-yyyy");
      });

      // ----------------------------------------

    };
    $scope.createChild = function(data) {
      var curentDate = $filter('date')(new Date(), "dd-MM-yyyy");
      var bithDate = $filter('date')(data.birthday, "dd-MM-yyyy");
      if(data.First_Name==''||data.First_Name==undefined){
        WebService.showAlert("Please enter First Name");
      }else if(data.Last_Name==''||data.Last_Name==undefined){
        WebService.showAlert("Please enter Last Name");
      }else if(data.Birth_City==''||data.Birth_City==undefined){
        WebService.showAlert("Please enter Birth City");
      }
      // else if(data.Birth_Country==''||data.Birth_Country==undefined){
      // WebService.showAlert("Please enter Birth Country ");
      // }
      else if(data.Street_Address==''||data.Street_Address==undefined){
        WebService.showAlert("Please enter Street Address");
      }
      // else if(data.child_relation==''||data.child_relation==undefined){
      // WebService.showAlert("Please enter Relation with child");
      // }
      else if(data.State==''||data.State==undefined){
        WebService.showAlert("Please enter State");
      } else if(data.zip_code==''||data.zip_code==undefined){
        WebService.showAlert("Please enter Zip Code");
      }else if(data.zip_code.length == 6){
        WebService.showAlert("Please enter Valid Zip Code");
      }
      // else if(data.Country==''||data.Country==undefined){
      // WebService.showAlert("Please enter Country");
      // }
      else if(data.birthday== "Date of Birth *"){
        WebService.showAlert("Please enter Date of Birth ");
      }
      // else if( data.sex==''|| data.sex==undefined){
      // WebService.showAlert("Please Select child sex");
      // }else if( data.plan==''|| data.plan==undefined){
      // WebService.showAlert("Please Select Payment Plan");
      // }
      else{
        var bithDate = $filter('date')(data.birthday, "dd-MM-yyyy");
        var url=$rootScope.url + '/v1/add_child';
        var base64String = window.localStorage['childbase64'];
        var params={child: { image : base64String ,first_name : data.First_Name, middle_name : data.Middle_Name, last_name : data.Last_Name, city: data.Birth_City, state: data.State, zip: data.zip_code, country: data.Birth_Country, birthday	: bithDate,  sex : data.sex, plan_id : data.plan } };
        var token = window.localStorage['token'];
        var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
        result.then(function(response){
          if (response.status == 200) {
            $location.path("/settings");
            WebService.showAlert("Child Created sucessfully");
          } else {
            WebService.showAlert("Problem in Creating Child");
          }
        },function(response) {
          WebService.showAlert(''+JSON.stringify(response));
        });
      }
    };
  });
});
// -----------------------------------------------------------------------------------------
kangaroo.controller('EditChildController', function EditChildController($scope,$cordovaDatePicker, $filter, $http, EditChildService,$rootScope, $location,WebService,LocalStore, $cordovaImagePicker, $ionicPlatform, $cordovaContacts) {

  $scope.collection = {
    selectedImage : ''
  };
  $ionicPlatform.ready(function() {
    window.localStorage['childImagebase64']='';
    // ------------------------------------------------------
    var params={};
    var url=$rootScope.url + '/v1/new_child';
    var token = window.localStorage['token'];
    var result=WebService.makeServiceCallHeader(url,params,$rootScope.GET,token);
    result.then(function(response){
      if (response.status == 200) {
        $scope.AllPlans=response.data.plan;
      }
    },function(response) {
      console.log(''+JSON.stringify(response));
    });
    // -----------------------------------------------------
    $scope.getImageSaveContact = function() {
      // Image picker will load images according to these settings
      var options = {
        maximumImagesCount: 1, // Max number of selected images, I'm
        // using only one for this example
        width: 200,
        height: 200,
        quality: 50            // Higher is better
      };
      $cordovaImagePicker.getPictures(options).then(function (results) {
        // Loop through acquired images
        for (var i = 0; i < results.length; i++) {
          $scope.collection.selectedImage = results[i];
          var extensions=  results[i].split('.');
          window.plugins.Base64.encodeFile($scope.collection.selectedImage, function(base64){
            window.localStorage['childImagebase64']=base64.replace("*",extensions[extensions.length-1]);
            $scope.childImage=base64;
            $scope.$apply();
          });
        }
      }, function(error) {
        console.log('Error: ' + JSON.stringify(error));
      });
    };
    var childDetail=EditChildService.getChildDetail();
    $scope.data={};
    $scope.childImage=childDetail.image;
    $scope.data.First_Name=childDetail.first_name;
    $scope.data.Middle_Name='';
    $scope.data.Last_Name=childDetail.last_name;
    $scope.data.Birth_City=childDetail.city;
    $scope.data.Birth_Country=childDetail.country;
    $scope.data.Street_Address=childDetail.street;
    // $scope.data.child_relation=childDetail.relation;
    $scope.data.State=childDetail.state;
    $scope.data.zip_code=childDetail.zip;
    $scope.data.Country=childDetail.country;
    $scope.data.birthday=childDetail.birthday;
    $scope.data.sex=childDetail.sex;
    $scope.data.plan=childDetail.plan;
    if(childDetail.sex){	$scope.data.sex = 'True';
    }else{$scope.data.sex = false;}
    $scope.selectDate = function() {
      var options = {
        date: new Date($scope.data.birthday),
        mode: 'date', // or 'time'
        maxDate: new Date() - 10000,
        allowOldDates: true,
        allowFutureDates: false,
        doneButtonLabel: 'DONE',
        doneButtonColor: '#F2F3F4',
        cancelButtonLabel: 'CANCEL',
        cancelButtonColor: '#000000'
      };
      $cordovaDatePicker.show(options).then(function(date){
        $scope.data.birthday= $filter('date')(date, "MM-dd-yyyy");
      });
      // ----------------------------------------
    };
    $scope.createChild = function(data) {
      var curentDate = $filter('date')(new Date(), "MM-dd-yyyy");
      var bithDate = $filter('date')(data.birthday, "Mm-dd-yyyy");
      if(data.First_Name==''||data.First_Name==undefined){
        WebService.showAlert("Please enter first name");
      }else if(data.Last_Name==''||data.Last_Name==undefined){
        WebService.showAlert("Please enter last name");
      }else if(data.Birth_City==''||data.Birth_City==undefined){
        WebService.showAlert("Please enter birth city");
      }else if(data.Street_Address==''||data.Street_Address==undefined){
        WebService.showAlert("Please enter street address");
      }else if(data.State==''||data.State==undefined){
        WebService.showAlert("Please enter state name");
      } else if(data.zip_code==''||data.zip_code==undefined){
        WebService.showAlert("Please enter zip/postal code");
      }else if(data.zip_code.length == 6){
        WebService.showAlert("Please enter Valid zip/postal Code");
      }else{
        var bithDate = $filter('date')(data.birthday, "dd-MM-yyyy");
        var url=$rootScope.url + '/v1/edit_child';
        var base64String = window.localStorage['childImagebase64'];
        var params={child_id:childDetail.id,child: {image : base64String ,first_name : data.First_Name, middle_name : data.Middle_Name, last_name : data.Last_Name, city: data.Birth_City, state: data.State, zip: data.zip_code, country: data.Birth_Country, birthday	: bithDate,  sex : data.sex, plan : data.plan } };
        console.log('params '+JSON.stringify(params));
        var token = window.localStorage['token'];
        var result=WebService.makeServiceCallHeader(url,params,$rootScope.POST,token);
        result.then(function(response){
          if (response.status == 200) {
            WebService.showAlert("Child information updated successfully");
            $location.path("/editProfile");
          } else {
            WebService.showAlert("Problem in updating Child information");
          }
        },function(response) {
          WebService.showAlert(''+JSON.stringify(response));
        });
      }
    };
  });
});
kangaroo.controller('profileController', function profileController($scope, $state, $http,EditChildService, $rootScope, $location, $ionicSlideBoxDelegate, profile) {
  $scope.profileList = [];
  $scope.check = true;

  $scope.slidePrevious = function() {
    $ionicSlideBoxDelegate.previous();
  }
  $scope.slideNext = function() {
    $ionicSlideBoxDelegate.next();
  }
  $scope.editChild=function(x) {
    EditChildService.addChildDetail(x);
    $location.path("/EditChild");
  };
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
  $scope.editUserProfile = function() {
    $location.path("/editUserProfile");
  };

  profile.allDetailswithChild(window.localStorage['token']).success(function(data) {
    console.log("Data", data);
    if (data.status == 200) {
      var str;
      var myList=[];

      $rootScope.parentInfo=data.data[0].parent;
      $scope.parentName = data.data[0].parent.name;
      $scope.parentAddress = data.data[0].parent.address;
      $scope.msgcount = data.data[2].messagcount;
      $scope.parentImage = data.data[0].parent.image;
      $scope.cdate = new Date();
      $ionicSlideBoxDelegate.enableSlide(true);
      $ionicSlideBoxDelegate.update();
      if (data.data[1].child != null) {
        for (var i = 0; i < data.data[1].child.length; i++) {
          console.log("Item", data.data[1].child[i]);
          // var created = new Date(data.data[1].child[i].date_created);

          // if ((created.getFullYear() != $scope.cdate.getFullYear()) ||
          // 	(created.getDate() != $scope.cdate.getDate()) ||
          // 	(created.getMonth() != $scope.cdate.getMonth()))
          // 	continue;

          var assign = {};
          assign.first_name = data.data[1].child[i].first_name;
          assign.status = data.data[1].child[i].status;
          assign.sdate = data.data[1].child[i].sdate;
          // assign.stime = data.data[1].child[i].stime;
          if(data.data[1].child[i].stime=='N/A'){
            // alert("if");
            assign.stime='';
            assign.checkedOut='';
          }else{
            // alert("else");
            var str = data.data[1].child[i].stime.split("/");
            var checkedIn = str[0];
            var CheckedOut = str[1];
            assign.stime=checkedIn;
            assign.checkedOut=CheckedOut;
          }

          assign.asdate = data.data[1].child[i].asdate;
          assign.image = data.data[1].child[i].image;
          assign.id = data.data[1].child[i].id;
          assign.assessment_details = data.data[1].child[i].assesment_details;
          console.log("Assign", assign);
          myList.push(assign);
        }
        $scope.profileList=myList;
        console.log("Profile List", $scope.profileList);
        if ($scope.profileList.length > 0)
          $scope.check = true;
        else
          $scope.check = false;

      } else {
        $scope.check = false;
      }
    } else {
      WebService.showAlert("Invalid request");
    }
  });
});

kangaroo.controller('messageController', function messageController($scope, $http, $rootScope, $location, message, WebService) {
  type = $location.search().MTYPE;
  console.log("type", type);
  console.log("token", window.localStorage['token']);
  message.allMessage(window.localStorage['token'], type).success(function(data) {
    console.log("Data", data);
    if (data.status == 200) {
      $scope.allmsg = data.data.message;
    }
  });

  $scope.favorite = function(msgcode, status) {
    console.log("Msg Code", msgcode);
    console.log("Status", status);
    message.favoriteMessage(window.localStorage['token'], msgcode, status).success(function(data) {
      console.log("Data", data);
      if (data.status == 200) {
        $location.path("/myMessages");
        WebService.showAlert("Message Seleted Sucessfully ");
      } else {
        WebService.showAlert("Error occur please try again !");
      }
    });
  };
});

kangaroo.controller('messageViewController', function messageViewController($scope, $http, $rootScope, $location, $timeout, $cordovaInAppBrowser, message, WebService) {
  mid = $location.search().MID;
  message.showMessage(window.localStorage['token'], mid).success(function(data) {
    if (data.status == 200) {
      $scope.subject = data.data.message.subject;
      $scope.body = data.data.message.html_body;
      $scope.sent_by = data.data.message.sent_by;
      $scope.date = data.data.message.date;
      $scope.mid = mid;

      $timeout(function(){
        $('.message-view-content a').on('click', function(ev){
          var link = $(ev.target).attr("href");
          if ($cordovaInAppBrowser) $cordovaInAppBrowser.open(link, '_system', {});
          ev.preventDefault();
        })
      }, 100);
    } else {
      WebService.showAlert("No Messages Found ");
    }
  });
  $scope.delete = function(mid, status) {
    message.deleteorfavoriteMessage(window.localStorage['token'], mid, status).success(function(data) {
      if (data.success == 200) {
        WebService.showAlert("Message Deleted Sucessfully ");
        $location.path("/myMessages");
      } else {
        WebService.showAlert("No Messages Found ");
      }
    });
  };

});

kangaroo.controller('newMsgController', function newMsgController($scope, $http, $rootScope, $location, message, WebService) {
  $scope.files = [];
  $scope.file_changed = function(files) {
    $scope.$apply(function(scope) {
      var photofile = files[0];
      console.log(photofile);
      console.log(photofile.name);
      console.log(photofile.size);
      console.log(photofile.type);
      var reader = new FileReader();
      reader.onload = function(e) {

        object = {};
        object.filename = photofile.name;
        object.filetype = photofile.type;
        object.filesize = photofile.size;
        object.data = e.target.result;
        $scope.files.push(object);
      };
      reader.readAsDataURL(photofile);
    });
  };

  $scope.submit = function() {
    message.newMessage(window.localStorage['token'], $scope.subject, $scope.body, $scope.files)
      .success(function(data) {
        if (data.status == 200) {
          $location.path("/myMessages");
          WebService.showAlert("Message Sucessfully Sent");
        }  else {
          WebService.showAlert("Message sent faild ");
          $location.path("/myMessages");
        }
      });

  };
});

kangaroo.controller('replyMsgController', function replyMsgController($scope, $http, $rootScope, WebService,$location, message) {
  $scope.subject = $location.search().SUB
  mid = $location.search().MID? $location.search().MID : "test";
  $scope.submit = function() {
    message.replyMessage(window.localStorage['token'], $scope.subject, $scope.body, mid).success(function(data) {
      if (data.status == '200') {
        WebService.showAlert("Message Sucessfully Sent");
        $location.path("/myMessages");
      } else {
        WebService.showAlert("Problem in message sending");
      }
    });

  };
});

kangaroo.controller('galleryController', function galleryController($scope, $http, $rootScope, $location, $ionicLoading,WebService, $ionicModal, profile) {
  profile.galleries(window.localStorage['token']).success(function(data) {
    if (data.status == 200) {
      $scope.gallery = data.data.gellary;
      // alert(JSON.stringify(data));
    }
    $scope.showImages = function(index) {
      $scope.activeSlide = index;
      $scope.showModal('partials/galleryView.html');
    }
    // Close the modal
    $scope.closeModal = function() {
      $scope.modal.hide();
      $scope.modal.remove()
    };

    $scope.download = function(url) {
      $ionicLoading.show({
        template : 'Saving...'
      });
      console.log("Url", url);
      var album = 'kangarootime';
      cordova.plugins.photoLibrary.saveImage(url, album, function (libraryItem) {
        console.log("LibraryItem", libraryItem);
        $ionicLoading.hide();
        WebService.showAlert("Photo Saved successfully!");
      }, function (err) {
        console.log("erorr----", err);
        if (err.startsWith('Permission')) {
          $scope.requestAuthorization(url);
        }
        else if(err=="Permission Denial: This application is not allowed to access Photo data."){
          $scope.requestAuthorization(url);
        }
        else{
          $ionicLoading.hide();
          console.log("Error occured:"+err+"!, Please try again later.");
          //WebService.showAlert("Error occured:"+err+"!, Please try again later.");
        }
      });
    }

    $scope.requestAuthorization=function(url){
      cordova.plugins.photoLibrary.requestAuthorization(
        function () {
          $scope.download(url);
        },
        function (err) {
          $ionicLoading.hide();
          console.log("erorr----Auth", err);
          WebService.showAlert("Denied Access to Photo Gallery");
        }, {read: true, write: true}
      );
    }

    $scope.showModal = function(templateUrl) {
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope : $scope,
        animation : 'slide-in-up'
      }).then(function(modal) {
        $scope.modal = modal;
        $scope.modal.show();
      });
    }

  });

});
