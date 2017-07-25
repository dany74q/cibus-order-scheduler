import re
import json
import logging
import requests
from uuid import uuid4
from urllib import urlencode
from bs4 import BeautifulSoup
from redis import StrictRedis
from argparse import ArgumentParser


class CibusOrderer(object):
	HEADERS = {
		'Upgrade-Insecure-Requests': '1',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3159.5 Safari/537.36',
		'Content-Type': 'application/x-www-form-urlencoded',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'Referer': 'https://www.mysodexo.co.il/',
		'Accept-Encoding': 'gzip, deflate, br',
		'Accept-Language': 'en-US,en;q=0.8,he;q=0.6'
	}


	SIGN_IN_URL = 'https://www.mysodexo.co.il/'
	ADD_TO_CART_URL = 'https://www.mysodexo.co.il/mobile/add2cart.aspx'
	PLACE_ORDER_URL = 'https://www.mysodexo.co.il/new_order.aspx?restId={rest_id}&fav=0&s=0&weekend=&ta=0&p=0'
	REST_ID_REGEX = 'restId=([^&]+)'

	def __init__(self):
		self._session = requests.Session()
		self._session.headers.update(self.HEADERS)
		logging.info('Using headers - {}'.format(self.HEADERS))

	def sign_in(self, username, password, company):
		form_data = self._get_form_data()
		self._sign_in(form_data, username, password, company)

	def order(self, cart, time, notes):
		logging.info('Got order with cart - {} - for time - {} - with notes - {}'.format(cart, time, notes))
		if not cart:
			logging.error('Invalid cart - {}'.format(cart))
			raise Exception('Invalid Cart')

		rest_id = None
		for item in cart:
			if not rest_id:
				rest_id = re.findall(self.REST_ID_REGEX, item)
				if rest_id:
					rest_id = rest_id[0]
					logging.info('Found rest_id - {}'.format(rest_id))
				else:
					logging.warn('Did not find rest_id - {}'.format(item))
			self.add_to_cart(item)

		order_obj = {
			'time': time,
			'notes': notes,
		}

		self.place_order(cart, order_obj, rest_id)

	def add_to_cart(self, item):
		logging.info('Adding item to cart - {}'.format(item))
		if not item:
			logging.error('Failed adding item to cart - {}'.format(item))
			raise Exception('Invalid item')

		r = self._session.post(self.ADD_TO_CART_URL, data=item, verify=False)
		self._verify_response(r)
		logging.info('Added item successfully')

	def place_order(self, cart, order_obj, rest_id):
		if not rest_id:
			logging.error('Did not find rest_id')
			raise Exception('Rest ID not found')

		order_id = str(uuid4())
		url = self.PLACE_ORDER_URL.format(rest_id=rest_id)
		logging.info('Placing order - {} from - {}'.format(order_id, url))
		r = self._session.get(url, verify=False)
		self._verify_response(r)

		html = BeautifulSoup(r.text, 'html5lib')
		form = html.find('form', {'id': 'aspnetForm'})
		if not form or not form.text:
			logging.error('Did not find order form')
			raise Exception('OrderForm not found')
		
		form_fields = form.findAll('input', {'type': 'hidden'})
		if not form_fields:
			logging.error('Did not find order form fields')
			raise Exception('OrderFormFields not found')

		form_data = {}
		for field in form_fields:
			if not 'name' in field.attrs:
				logging.warn('Did not find name for order form field - {} - skipping'.format(field))
				continue

			if not 'value' in field.attrs:
				logging.warn('Did not find value for order form field - {} - skipping'.format(field))
				continue

			form_data[field.attrs['name']] = field.attrs['value']

		form_data.update({
			'ctl00$cphFilters$_ctrl_0$rest$ctrl0$ddlTime': '0',
			'ctl00$cphMain$ddlTime': order_obj['time'],
			'ctl00$cphMain$ddlMin': '0',
			'ctl00$cphMain$ddlMis': '0.00',
			'ctl00$cphMain$order$grdn$ctrl0$ctl00': order_obj['notes'],
			'ctl00$cphMain$txtNotes': '{}~'.format(order_obj['notes']),
			'ctl00$txt2': '',
			'ctl00$hidP': '0',
			'__EVENTTARGET': 'ctl00%24cphMain%24ctl01',
			'ctl00$cphMain$hidSplit': ''
		})

		discount = 0
		discount_obj = html.find('span', {'class': 'disco'})
		if discount_obj and discount_obj.text:
			discount_arr = re.findall('\d+', discount_obj.text)
			if discount_arr:
				discount = discount_arr = int(discount_arr[0])
		order_obj['discount'] = discount
		order_obj['price'] = self._compute_price(cart, discount)

		self._place_order(url, form_data, order_obj)

	def _compute_price(self, cart, discount):
		price = 0
		for item in cart:
			item_prices = re.findall('price=([\d]+)', item, re.I)
			if item_prices:
				for item_price in item_prices:
					price += int(item_price)
		return price * ((100 - discount) / 100.0)

	def _place_order(self, url, form_data, order_obj):
		form_data = urlencode(form_data)
		price, user, company, email = order_obj['price'], self._session.cookies['username'], self._session.cookies['company'], self._session.cookies['Cemail']
		logging.info('Making transaction for price - {} and user - {} and email - {} and company - {} and form_data - {}'.format(price, user, email, company, form_data))
		# r = self._session.post(url, data=form_data, verify=False)
		# self._verify_response(r)
		logging.info('Transaction complete for price - {} and user - {} and email - {} and company - {}'.format(price, user, email, company))
		
	
	def _sign_in(self, form_data, username, password, company):
		form_data.update({'txtUsr': username, 'txtPas': password, 'txtCmp': company, 'remember_me': 'on', '__EVENTTARGET': 'btn', '__EVENTARGUMENT': ''})
		data = urlencode(form_data)
		logging.info('Signing in with data = {}'.format(data))
		r = self._session.post(self.SIGN_IN_URL, data=data, verify=False)
		self._verify_response(r)
		logging.info('Signed in successfully')

	def _get_form_data(self):
		logging.info('Getting form data from - {}'.format(self.SIGN_IN_URL))
		r = self._session.get(self.SIGN_IN_URL, verify=False)
		self._verify_response(r)
		html = BeautifulSoup(r.text, "html5lib")
		form = html.find('form', {'id': 'form'})
		if not form or not form.text:
			logging.error('Did not find form for id - #form')
			raise Exception('Form not found')
		hidden_fields = form.findAll('input', {'type': 'hidden'})
		if not hidden_fields:
			logging.error('Did not find hidden fields for input[type=hidden]')
			raise Exception('Hidden field not found')
		form_data = {}
		for f in hidden_fields:
			if not 'name' in f.attrs:
				logging.error('Did not find name in hidden field - {}'.format(f))
				raise Exception('Name in field not found')
			if not 'value' in f.attrs:
				logging.error('Did not find value in hidden field - {}'.format(f))
				raise Exception('Value in field not found')
			name, value = f.attrs['name'], f.attrs['value']
			if name and value:
				logging.info('Adding field with name - {} and value - {}'.format(name, value))
				form_data[f.attrs['name']] = f.attrs['value']
		return form_data


	def _verify_response(self, response):
		logging.info('Got code - {}'.format(response.status_code))
		assert response.status_code == 200, 'Did not get HTTP OK from url - {} - but got - {}'.format(response.url,response.status_code)


def base64_decode_utf8_encode(s):
	try:
		s = s.decode('base64')
	except:
		pass

	try:
		return s.encode('utf-8')
	except:
		try:
			return s.encode('windows-1255')
		except:
			return s


if '__main__' == __name__:
	logging.basicConfig(level=logging.INFO)
	parser = ArgumentParser()
	# parser.add_argument('--username', required=True, help='Cibus username', type=try_encode_utf_8)
	# parser.add_argument('--password', required=True, help='Cibus password', type=try_encode_utf_8)
	# parser.add_argument('--company', required=True, help='Cibus company', type=lambda s: try_encode_utf_8(s.decode('base64')))
	parser.add_argument('--order-str', dest='order_str', required=True, help='Cibus order object', type=base64_decode_utf8_encode)
	# r = redis.StrictRedis(host='localhost', port=6379, db=0)	
	args = parser.parse_args()
	try:
		order_obj = json.loads(args.order_str)
		cibus_orderer = CibusOrderer()
		cibus_orderer.sign_in(
			username=base64_decode_utf8_encode(order_obj['username']),
			password=base64_decode_utf8_encode(order_obj['password']),
			company=base64_decode_utf8_encode(order_obj['company']))
		time, notes = base64_decode_utf8_encode(order_obj['time']), base64_decode_utf8_encode(order_obj['notes'])
		cart = map(base64_decode_utf8_encode, base64_decode_utf8_encode(order_obj['cart']))
		cibus_orderer.order(cart=cart, time=time, notes=notes)
	except:
		logging.exception('Failed parsing - {}'.format(args.order_str))