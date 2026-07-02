const $ = s => document.querySelector(s);

function fullName(p) { return `${p.first} ${p.last}`.trim() }

async function renderAdmin() {
  const { data, error } = await sbClient.from('rsvps').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return }
  const confirmed = data.filter(x => x.status === 'confirmed');
  const declined = data.filter(x => x.status === 'declined');
  const people = confirmed.flatMap(x => x.people || []);
  $('#stTotal').textContent = people.length;
  $('#stConfirmed').textContent = people.length;
  $('#stDeclined').textContent = declined.length;
  $('#stAdults').textContent = people.filter(p => p.type !== 'kid').length;
  $('#stKids').textContent = people.filter(p => p.type === 'kid').length;
  $('#stFamilies').textContent = confirmed.length;
  $('#adminRows').innerHTML = data.map(x => {
    const host = { first: x.host_first, last: x.host_last };
    return `<tr><td>${fullName(host)}</td><td>${(x.people || []).slice(1).map(fullName).join(', ') || '-'}</td><td><span class="tag">${x.status === 'confirmed' ? 'Confirmado' : 'Não irá'}</span></td><td>${new Date(x.created_at).toLocaleString('pt-BR')}</td></tr>`;
  }).join('') || '<tr><td colspan="4">Nenhuma confirmação ainda.</td></tr>';
}

function unlock() {
  $('#gate').classList.add('hidden');
  $('#dashboard').classList.remove('hidden');
  renderAdmin();
}

function lock() {
  $('#dashboard').classList.add('hidden');
  $('#gate').classList.remove('hidden');
  $('#gatePassword').value = '';
}

async function tryLogin() {
  const email = $('#gateEmail').value.trim();
  const password = $('#gatePassword').value;
  const btn = $('#gateEnter');
  btn.disabled = true;
  const { error } = await sbClient.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  if (error) { $('#gateError').classList.remove('hidden'); return }
  $('#gateError').classList.add('hidden');
  unlock();
}

$('#gateEnter').onclick = tryLogin;
$('#gatePassword').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin() });
$('#refreshBtn').onclick = renderAdmin;
$('#logoutBtn').onclick = async () => { await sbClient.auth.signOut(); lock() };

sbClient.auth.getSession().then(({ data: { session } }) => { if (session) unlock() });
