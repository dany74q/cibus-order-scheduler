$(document).ready(function() {
	var cart = [];
	var token = undefined;
	var sessionId = document.cookie.split('; ').filter(function(item, idx) { return item.search('token=') !== -1; })[0].match(/token=(.*)/)[1];

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
		debugger;

		var notes = document.querySelector('textarea[name="ctl00$cphMain$order$grdn$ctrl0$ctl00"]').value;
		var time = $('.schedule-time option:selected').text();
		var day = $('.schedule-day option:selected').val();		
		var token = sessionId;
		// Send schedule
		sendScheduleMessage({
			scheduleMessage: true,
			time: time,
			day: day,
			notes: notes,
			cart: cart,
			token: token
		});
	};

	var sendScheduleMessage = function(message) {
		chrome.runtime.sendMessage(message);
	};

	var updateCart = function(new_cart, callback) {
		chrome.storage.sync.set({cart: new_cart}, callback);
	}

	if (location.href.search('new_order') !== -1) {
		var cancelButton = $('.button:contains(בטל)');
		cancelButton.click(function() {
			updateCart([]);
			return true;
		});

		var timeSelectBox = $('<select class="schedule-time"></select>');
		var times = $('#ctl00_cphFilters__ctrl_0_rest_ctrl0_ddlTime option');
		$.each(times, function(idx, time) {
			timeSelectBox.append(time.outerHTML);
		})
		var daysOfTheWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
		var daysSelectBox = $('<select class="schedule-day"></select>');
		$.each(daysOfTheWeek, function(idx, day) {
			daysSelectBox.append('<option value="' + idx + '">' + day + '</option>');
		});
		var modalHtml = '<div id="modal" style="text-align: center;"><h1>תזמון הזמנה</h1><br /><span><h4>תזמן לשעה: </h4>' + timeSelectBox[0].outerHTML + '</span><span><h4>כל יום: </h4>' + daysSelectBox[0].outerHTML + '</span><br /><br /><span class="checkout" style="margin-bottom: 30px !important; text-align: center; margin-right: 0px !important; width: 100% !important;"><a class="button schedule-submit" style="float: initial !important; margin-left: initial !important; cursor: pointer;">תזמן הזמנה</a></span></div>';
		$('body').append(modalHtml);
		$('.button.send').before('<a class="button schedule-cart trigger-modal" style="cursor: pointer; background: rgb(0, 193, 23); margin-left: 60px;">תזמון הזמנה</a>')
		$("#modal").iziModal();
		$('.trigger-modal').click(function() {
			$('.schedule-time').val('0');
			$('.schedule-day').val(new Date().getDay().toString());
			$('.schedule-submit').click(scheduleCart);
			$('#modal').iziModal('open');
		});
	}

});