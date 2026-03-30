(async () => {
  const email = `test${Date.now()}@example.com`;
  console.log('email', email);

  const reg = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, password: 'Password1', location: 'Kigali' }),
  });
  console.log('reg', reg.status);
  const regData = await reg.json().catch(() => null);
  console.log('regData', regData);

  const login = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password1' }),
  });
  console.log('login', login.status);
  const loginData = await login.json().catch(() => null);
  console.log('loginData', loginData);

  if (!loginData?.token) {
    console.error('No token returned');
    return;
  }

  const talent = await fetch('http://localhost:5000/api/talents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.token}` },
    body: JSON.stringify({ title: 'Test Talent', description: 'Testing', category: 'Visual Arts' }),
  });
  console.log('talent', talent.status);
  const talentData = await talent.json().catch(() => null);
  console.log('talentData', talentData);
})();