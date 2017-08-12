chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    debugger;
    var itemId = '';
    var message = undefined;

    if (details.method === "GET") {
    	var uri = new URI(details.url);
    	var queryObj = uri.query(true);
		  itemId = queryObj.typ;

    	if (queryObj.del !== undefined) {
	    	message = {delete: true, itemId: itemId};
    	} else if (queryObj.clear !== undefined) {
        message = {clear: true};
    	} else {
    		message = {addItem: true, itemId: itemId, item: uri.query()};
    	}
    } else if (details.method === "POST") {
    	var uri = new URI();
    	uri.query(details.requestBody.formData);
    	itemId = uri.query(true).typ;
    	message = {addItem: true, itemId: itemId, item: uri.query()};
    }

    if (message !== undefined) {
    	chrome.tabs.query({url: ['*://*.mysodexo.co.il/*', '*://*.cibus.co.il/*']}, function(tabs) {
  			chrome.tabs.sendMessage(tabs[0].id, message);
		});
    }
  },
  {urls: ["*://*.mysodexo.co.il/*add2cart*", "*://*.cibus.co.il/*add2cart*"]},
  ["blocking", "requestBody"]
);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.scheduleMessage === true) {
    delete request.scheduleMessage;
		var posting = $.post('https://cibusscheduler.azurewebsites.net/api/AddCibusSchedule?code=CuDpdAfwNTzuOFJNULIiQZtg9TdKNha9xOiqbnBkr4QuEqclnOXRPQ==', JSON.stringify(request), function(res) {
      debugger;
    });
  
    posting.fail(function(err) {
      debugger;
    });
	}
});