chrome.storage.sync.get('token', function(items) {
	if (items.token !== undefined) {
		var posting = $.post('https://cibusscheduler.azurewebsites.net/api/GetCibusSchedules?code=Ni6Cou2H1hyf1h8HF6uybHepocnXwZlfiFYhndwZjlGkc1/BGYXseA==', JSON.stringify({token: items.token}), function(schedules) {
			$('.schedules').append('<p>success</p>');
			for (var i = schedules.length - 1; i >= 0; i--) {
				$('.schedules').append('<p>schedule - ' + schedules[i].name + '</p>');
			}
		});

		posting.fail(function(err) {
			Materialize.toast('לא הצלחתי לקבל את התזמונים במערכת ): אנא נסה שנית מאוחר יותר', 3000, 'red');
		});
	} else {
		location.href = '/login.html';
	}
});