import json
from urllib import request

email = f"test{__import__('time').time_ns()}@example.com"
print('email', email)

headers = {'Content-Type': 'application/json'}
req = request.Request('http://localhost:5000/api/auth/register', data=json.dumps({'name': 'Test User', 'email': email, 'password': 'Password1', 'location': 'Kigali'}).encode('utf-8'), headers=headers, method='POST')
with request.urlopen(req) as resp:
    print('reg', resp.status)
    print('regData', resp.read().decode())

req = request.Request('http://localhost:5000/api/auth/login', data=json.dumps({'email': email, 'password': 'Password1'}).encode('utf-8'), headers=headers, method='POST')
with request.urlopen(req) as resp:
    print('login', resp.status)
    loginData = json.loads(resp.read().decode())
    print('loginData', loginData)

token = loginData.get('token')
if not token:
    raise SystemExit('no token')

headers['Authorization'] = f'Bearer {token}'
req = request.Request('http://localhost:5000/api/talents', data=json.dumps({'title': 'Test Talent', 'description': 'Testing', 'category': 'Visual Arts'}).encode('utf-8'), headers=headers, method='POST')
with request.urlopen(req) as resp:
    print('talent', resp.status)
    print('talentData', resp.read().decode())
