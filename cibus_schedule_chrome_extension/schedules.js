chrome.storage.sync.get('token', function(items) {
	if (items.token !== undefined) {
		$.post('http://localhost:1337/schedules', {token: items.token});
	}
});