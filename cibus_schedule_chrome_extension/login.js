$('button[type="submit"]').click(function(e) {
	e.preventDefault();
	var email = $('input#email').val();
	var cibus_company = $('input#cibus-company').val();
	var cibus_password = $('input#cibus-password').val();

	var data = {
		email: email,
		company: cibus_company,
		password: cibus_password
	};

	if (!validate_form(data)) {
		return Materialize.toast('אנא מלאו את כל הפרטים', 3000, 'red');
	}

	var posting = $.post('https://cibusscheduler.azurewebsites.net/api/LoginCibusUser?code=unU8zibpcHJx8asRhQPELNwsr5V5nJSljz1e1zq9w6Pn3wkEsxLhuA==', JSON.stringify(data), function(res) {
		chrome.storage.sync.set({token: res.token}, function() {
			location.href = '/schedules.html';
		});
	});

	posting.fail(function(err) {
		return Materialize.toast('התחברות נכשלה ): אנא נסו שנית מאוחר יותר', 3000, 'red');
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