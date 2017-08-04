var host = 'http://localhost:1337';
var token = undefined;

var checkAuthentication = function() {
	chrome.storage.sync.get('token', function(items) {
		if (items.token === undefined) {
			showRegisterLogin();
		} else {
			token = items.token;
			showUserSchedules();
		}
	});
};

var showRegisterLogin = function() {
	location.href = '/login.html';
};

var showUserSchedules = function() {
	location.href = 'schedules.html';
};

checkAuthentication();