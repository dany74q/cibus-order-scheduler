$('button[type="submit"]').click(function(e) {
	e.preventDefault();
	var email = $('input#email').val();
	var cibus_user = $('input#cibus-user').val();
	var cibus_company = $('input#cibus-company').val();
	var cibus_password = $('input#cibus-password').val();

	var data = {
		email: email,
		cibus_user: cibus_user,
		cibus_company: cibus_company,
		cibus_password: cibus_password
	};

	if (!validate_form(data)) {
		return Materialize.toast('אנא מלאו את כל הפרטים', 2000, 'red');
	}

	var posting = $.post('http://localhost:1337/register', data, function(res) {
		chrome.storage.sync.set({token: res.token}, function() {
			location.href = 'shcedules.html';
		});
	});

	posting.fail(function(err) {
		return Materialize.toast('הרשמה נכשלה ): אנא נסו מאוחר יותר', 2000, 'red');
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