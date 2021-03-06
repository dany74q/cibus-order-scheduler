$('button[type="submit"]').click(function(e) {
	e.preventDefault();
	var email = $('input#email').val();
	var cibus_user = $('input#cibus-user').val();
	var cibus_company = $('input#cibus-company').val();
	var cibus_password = $('input#cibus-password').val();

	var data = {
		email: email,
		user: cibus_user,
		company: cibus_company,
		password: cibus_password
	};

	if (!validate_form(data)) {
		return Materialize.toast('אנא מלאו את כל הפרטים', 3000, 'red');
	}

	var posting = $.post('https://cibusscheduler.azurewebsites.net/api/register?code=7C4QBfbB/5Dw9d065/KL43sOCW8V0fQsfahVRMuUvfkarxPQHz7b6A==', JSON.stringify(data), function(res) {
		chrome.storage.sync.set({token: res.token}, function() {
			location.href = '/schedules.html';
		});
	});

	posting.fail(function(err) {
		return Materialize.toast('הרשמה נכשלה ): אנא נסו שנית מאוחר יותר', 3000, 'red');
	});
});

var validate_form = function(form) {
	for (key in form) {
		if (form[key].length === 0) {
			return false;
		}
	}
	return true;
} 