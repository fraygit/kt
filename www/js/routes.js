var kangarooRoutes = angular.module("kangarooRoutes", [ "ngRoute" ]);
kangarooRoutes.config(function($routeProvider) {
	$routeProvider.when('/whyKangaroo', {
		templateUrl : 'partials/whyKangaroo.html'
	}).when('/signIn', {
		controller: 'signInController',
		templateUrl : 'partials/signIn.html'
	}).when('/beforeSignIn', {
		templateUrl : 'partials/beforeSignIn.html'
	}).when('/signUp', {
		controller: 'signUpController',
		templateUrl : 'partials/signUp.html'
	}).when('/centerCodeVerified', {
		controller: 'centerCodeVerifiedController',
		templateUrl : 'partials/centerCodeVerified.html'
	}).when('/landingPage', {
		templateUrl : 'partials/landingPage.html'
	}).when('/dayCare', {
		templateUrl : 'partials/dayCare.html'
	}).when('/parents', {
		templateUrl : 'partials/parents.html'
	}).when('/whatWeDo', {
		templateUrl : 'partials/whatWeDo.html'
	}).when('/dashboard', {
		controller: 'dashbordController',
		templateUrl : 'partials/dashboard.html'
	}).when('/contactUs', {
		controller: 'contactUsController',
		templateUrl : 'partials/contactUs.html'
	}).when('/editProfile', {
		controller: 'profileController',
		templateUrl : 'partials/editProfile.html'
	}).when('/editUserProfile', {
		controller: 'editprofileController',
		templateUrl : 'partials/editUserProfile.html'
	}).when('/myMessages', {
		controller: 'messageController',
		templateUrl : 'partials/myMessages.html'
	}).when('/messageView', {
		controller: 'messageViewController',
		templateUrl : 'partials/messageView.html'
	}).when('/newMsg', {
		controller: 'newMsgController',
		templateUrl : 'partials/newMsg.html'
	}).when('/replyMsg', {
		controller: 'replyMsgController',
		templateUrl : 'partials/replyMessage.html'
	}).when('/checkInOut', {
		controller: 'CheckInOutController',
		templateUrl : 'partials/check_in_out.html'
	}).when('/calendar', {
		templateUrl : 'partials/calendar.html'
	}).when('/gallery', {
		templateUrl : 'partials/gallery.html'
	}).when('/settings', {
		controller: 'settingController',
		templateUrl : 'partials/settings.html'
	}).when('/billing', {
		controller: 'billingController',
		templateUrl : 'partials/billing.html'
	}).when('/galleryView', {
		templateUrl : 'partials//galleryView.html'
	}).when('/checkInPin', {
		controller: 'CheckInPinController',
		templateUrl : 'partials/Check-in_pin.html'
	}).when('/checkIn', {
		controller: 'CheckInController',
		templateUrl : 'partials/check_in.html'
	}).when('/checkOut', {
		controller: 'CheckOutController',
		templateUrl : 'partials/check_out.html'
	}).when('/calendarEvent', {
		templateUrl : 'partials/calendar_sub.html'
	}).when('/CreateChild', {
		controller: 'CreateChildController',
		templateUrl : 'partials/Create_Child.html'
	}).when('/EditChild', {
		controller: 'EditChildController',
		templateUrl : 'partials/edit_child.html'
	}).when('/ChangePassword', {
		controller: 'changePasswordController',
		templateUrl : 'partials/change_password.html'
	}).when('/RelationshipProfile', {
		controller: 'relationShipController',
		templateUrl : 'partials/relationship_profile.html'
	}).when('/SetPrivilege', {
		controller: 'SetPrivilegeController',
		templateUrl : 'partials/set_privilege.html'
	}).when('/setPrivilegeDetail', {
		controller: 'SetPrivilegeDetailController',
		templateUrl : 'partials/set_privilege_detail.html'
	}).when('/billingMenus', {
		controller: 'billingMenuController',
		templateUrl : 'partials/billingMenus.html'
	}).when('/dueAmount', {
		controller: 'duoAmountController',
		templateUrl : 'partials/due_amount.html'
	}).when('/cardInformation', {
		controller: 'cardInfoController',
		templateUrl : 'partials/card_information.html'
	}).when('/listChildren', {
		controller: 'listChildController',
		templateUrl : 'partials/list_children.html'
	}).when('/paidAmount', {
		controller: 'paidAmountController',
		templateUrl : 'partials/paid_amount.html'
	}).when('/listChildReport', {
		controller: 'listChildReportController',
		templateUrl : 'partials/list_child_report.html'
	}).when('/ReportView', {
		controller: 'reportViewController',
		templateUrl : 'partials/report_view.html'
	}).when('/billingACH', {
		controller: 'billingACHController',
		templateUrl : 'partials/billing_ach.html'
	}).when('/assessmentChild', {
		controller: 'listAssessmentsChilds',
		templateUrl : 'partials/assessment_child.html'
	}).when('/assessmentList', {
		controller: 'AssessmentsList',
		templateUrl : 'partials/assessment_list.html'
	}).when('/assessmentDetail', {
		controller: 'AssessmentDetailController',
		templateUrl : 'partials/assessment_detail.html'
	})

	.otherwise({
		redirectTo : '/signIn'
	});

});
