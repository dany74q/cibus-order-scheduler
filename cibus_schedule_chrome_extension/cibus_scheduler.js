$(document).ready(function() {
	var cart = [];
	var token = undefined;
	var sessionId = document.cookie.split('; ').filter(function(item, idx) { return item.search('token=') !== -1; });
	if (!!!sessionId || sessionId.length === 0) {
		return;
	} else {
		sessionId = sessionId[0].match(/token=(.*)/)[1];
	}

    chrome.storage.sync.get('sessionId', function(items) {
    	if (sessionId !== items.sessionId || items.sessionId === undefined) {
    		// New session - update & remove cart
    		chrome.storage.sync.set({sessionId: sessionId}, function() {
    			cart = [];
    			updateCart(cart, onAddCartItem);
    		});
    	} else {
			chrome.storage.sync.get('cart', function(items) {
		    	cart = items.cart || [];
		    	updateCart(cart, onAddCartItem);
		    });
    	}
    });

    chrome.storage.sync.get('token', function(items) {
    	token = items.token;

		if (!!token && location.href.search('new_order') !== -1) {
			var cancelButton = $('.button:contains(בטל)');
			cancelButton.click(cancelButtonHandler);

			var timeSelectBox = $('<select class="schedule-time" onfocus="this.size=6;" onblur="this.size=1;" onchange="this.size=1; this.blur();"></select>');
			for (var i = 7; i < 24; ++i) {
				var time = pad(i, 2) + ':00';
				timeSelectBox.append('<option value="' + time + '">' + time + '</option>');
				time = pad(i, 2) + ':30';
				timeSelectBox.append('<option value="' + time + '">' + time + '</option>');
			}	
			var daysOfTheWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
			var daysSelectBox = $('<select class="reschedule-day"></select>');
			$.each(daysOfTheWeek, function(idx, day) {
				daysSelectBox.append('<option value="' + idx + '">' + day + '</option>');
			});
			var modalHtml = '<div id="schedule-modal"><h1>תזמון הזמנה</h1><br /><h4>לתאריך: <input type="text" id="schedule-datepicker"></h4><h4>לשעה: ' + timeSelectBox[0].outerHTML + '</h4><span><h4>תזמון חוזר<input type="checkbox" id="schedule-repeatedly-checkbox" /></h4><h4 id="schedule-repeatedly">כל יום: ' + daysSelectBox[0].outerHTML + '</h4></span><br /><br /><div id="schedule-err" /><span id="schedule-checkout" class="checkout"><a class="button schedule-submit">תזמן הזמנה</a></span></div>';
			$('body').append(modalHtml);
			$('.button.send').before('<a class="button schedule-cart trigger-modal">תזמון הזמנה</a>');
			$("#schedule-modal").iziModal();
	
			$('.trigger-modal').click(triggerModalHandler);
		}    	
    });

    var onAddCartItem = function() {
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			debugger;
			if (request.delete) {
				deleteItem(request.itemId);
			} else if (request.clear) {
				clearcart();
			} else if (request.addItem) {
				addItem(request.itemId, request.item);
			}
		});
    }


	var deleteItem = function(itemId) {
		cart = localStorage.cart.filter(function(item, idx) { 
			item.itemId !== itemId;
		});
		updateCart(cart);
	};

	var clearcart = function() {
		cart = [];
		updateCart(cart);
	};

	var addItem = function(itemId, item) {
		cart.push({
			itemId: itemId,
			item: item
		});
		updateCart(cart);
	};

	var scheduleCart = function() {
		var notes = document.querySelector('textarea[name="ctl00$cphMain$order$grdn$ctrl0$ctl00"]').value;
		var scheduleDate = $('#schedule-datepicker').val();
		var splat = scheduleDate.split('/');
		scheduleDate = splat[1] + '/' + splat[0] + '/' + splat[2];
		var scheduleHour = $('.schedule-time').val();
		var shouldReschedule = $('#schedule-repeatedly-checkbox')[0].checked;

		if (scheduleDate)

		var data = {
			scheduleMessage: true,
			token: token,
			cart: cart,
			scheduleDate: scheduleDate,
			scheduleHour: scheduleHour,
			shouldReschedule: shouldReschedule,
		};

		if (!!shouldReschedule) {
			var rescheduleDay = $('.reschedule-day option:selected').val();
			var rescheduleHour = scheduleHour;
			data.rescheduleDay = rescheduleDay;
			data.rescheduleHour = rescheduleHour;
		}

		// Send schedule
		if (!validateScheduleMessage(data)) {
			$('#schedule-err').text('אנא מלאו את כל הפרטים כשורה.');
		} else {
			sendScheduleMessage(data);
		}
	};

	var validateDate = function(date) {
		return !!Date.parse(date) && Date.parse(date) !== NaN;
	};

	var validateHour = function(hour) {
		if (!!!hour) {
			return false;
		}

		var timeParts = hour.split(':');
		return timeParts.length === 2 && !!Number.parseInt(timeParts[0]) && Number.parseInt(timeParts[0]) >= 7 && Number.parseInt(timeParts[0]) <= 23 && !!Number.parseInt(timeParts[1]) && (Number.parseInt(timeParts[1]) === 0 || Number.parseInt(timeParts[1]) === 30);
	};

	var validateScheduleMessage = function(message) {
		if (!validateDate(message.scheduleDate)) {
			return false;
		} else if (!validateHour(message.scheduleHour)) {
			return false;
		}

		if (!!!message.shouldReschedule) {
			if (!!message.rescheduleDay || !!message.rescheduleHour) { 
				return false;
			}
		} else {
			return validateDate(message.rescheduleDay) && validateHour(message.rescheduleHour);
		}

		return true;
	};

	var sendScheduleMessage = function(message) {
		chrome.runtime.sendMessage(message);
	};

	var updateCart = function(new_cart, callback) {
		chrome.storage.sync.set({cart: new_cart}, callback);
	};

	var pad = function(num, size) {
	    var s = num + "";
	    while (s.length < size) {
	    	s = "0" + s;
	    }
	    return s;
	};

	var cancelButtonHandler = function() {
		updateCart([]);
		return true;
	};

	var scheduleRepeatedlyHandler = function() {
		$('#schedule-repeatedly').toggle();
		var chosenDate = $('#schedule-datepicker').val();
		if (!!!chosenDate) {
			chosenDate = new Date();
		} else {
			var splat = chosenDate.split('/');
			chosenDate = splat[1] + '/' + splat[0] + '/' + splat[2];
		}
		var day = new Date(chosenDate).getDay();
		day = day > 5 ? 0 : day;
		$('.reschedule-day option[value="' + day + '"]')[0].selected = true
	};

	var triggerModalHandler = function() {
		$('.schedule-time').val('0');
		$('.reschedule-day').val(new Date().getDay().toString());
		$('.schedule-submit').click(scheduleCart);
		$('#schedule-modal').iziModal('open');

		$('.schedule-time').click(function() {
			var s = $(this);
			var currentTime = pad(new Date().getHours(), 2) + ':00';
			var optionTop = s.find('[value="' + currentTime + '"]').offset().top;
			var selectTop = s.offset().top;
			s.scrollTop(s.scrollTop() + (optionTop - selectTop));
		});	

		// Initialize datePicker
		window.initializeDatepicker = function() {
			$('#schedule-datepicker').datepicker();
			$('#schedule-datepicker').blur();
		};
		var script = document.createElement('script');
		script.appendChild(document.createTextNode('('+ initializeDatepicker +')();'));
		(document.body || document.head || document.documentElement).appendChild(script);

		$('#schedule-repeatedly-checkbox').click(scheduleRepeatedlyHandler);
	};
});