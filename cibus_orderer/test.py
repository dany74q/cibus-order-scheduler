import json

j = json.dumps({
	'username': 'ZGFzaGVtZXM=',
	'password': 'MTIzNA==',
	'company': '157Xmden16jXldeh15XXpNeY',
	'cart': [
		'ZGlzaElkPTI4MjQ2MDImZGlzaE5hbWU9JUQ3JUExJUQ3JTlDJUQ3JTk4JTIwJUQ3JUE3JUQ3JUE4JUQ3JUEwJUQ3JUEzJTIwJUQ3JUEyJUQ3JTlEJTIwJUQ3JTkwJUQ3JUEwJUQ3JTk4JUQ3JUE4JUQ3JTk5JUQ3JUE3JUQ3JTk1JUQ3JTk4JmNhdD0yODI0NTk1JnByaWNlPTQ2JnR5cD03ODM2JmNudD0xJnVzZXI9LTEmYW1vdW50PTEmcmVzdElkPTY1MDQmc2RJZD0yODI0NTk5JnNkTmFtZT0lRDclQTklRDclOUUlRDclOUYlMjAlRDclOTYlRDclOTklRDclQUElMjAlRDclOUUlRDclOUMlRDclOTclMjAlRDclOTUlRDclOUMlRDclOTklRDclOUUlRDclOTUlRDclOUYlMjAmc2RQcmljZT0wJmdyb3VwPTI4MjQ1OTg='
	],
	'time': 'MTc6MDA=',
	'notes': '15nXldedINeg16LXmdedIQ=='
}).encode('base64')

print j