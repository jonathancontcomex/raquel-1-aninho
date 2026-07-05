const $ = s => document.querySelector(s);

const STOPWORDS = ['familia', 'família', 'sr', 'sra', 'sr.', 'sra.', 'dona', 'senhor', 'senhora', 'e'];

function fullName(p) { return `${p.first} ${p.last}`.trim() }

function normalize(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function significantWords(name) {
  return normalize(name).split(/\s+/).filter(w => w.length >= 2 && !STOPWORDS.includes(w));
}

let rsvpsData = [];

async function renderAdmin() {
  const { data, error } = await sbClient.from('rsvps').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return }
  rsvpsData = data;
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
  renderGuestList();
}

function rowSearchText(row) {
  const names = [`${row.host_first} ${row.host_last}`, ...(row.people || []).map(fullName)];
  return normalize(names.join(' '));
}

function matchStatus(guestName) {
  const words = significantWords(guestName);
  if (!words.length) return 'pending';
  const confirmedHit = rsvpsData.some(r => r.status === 'confirmed' && words.every(w => rowSearchText(r).includes(w)));
  if (confirmedHit) return 'confirmed';
  const declinedHit = rsvpsData.some(r => r.status === 'declined' && words.every(w => rowSearchText(r).includes(w)));
  if (declinedHit) return 'declined';
  return 'pending';
}

async function renderGuestList() {
  const { data, error } = await sbClient.from('guest_list').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return }
  const rows = data.map(g => ({ ...g, status: matchStatus(g.name) }));
  $('#glTotal').textContent = rows.length;
  $('#glConfirmed').textContent = rows.filter(r => r.status === 'confirmed').length;
  $('#glPending').textContent = rows.filter(r => r.status === 'pending').length;
  const tagHtml = status => status === 'confirmed'
    ? '<span class="gl-tag ok">✓ Confirmado</span>'
    : status === 'declined'
      ? '<span class="gl-tag no">Avisou que não vai</span>'
      : '<span class="gl-tag pending">Sem resposta</span>';
  $('#guestListRows').innerHTML = rows.map(r => `<tr><td>${r.name}</td><td>${tagHtml(r.status)}</td><td><button class="gl-del" title="Remover da lista" onclick="removeGuestListEntry('${r.id}')">✕</button></td></tr>`).join('') || '<tr><td colspan="3">Nenhum nome na lista ainda.</td></tr>';
}

async function saveGuestList() {
  const raw = $('#guestListInput').value;
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;
  const { data: existing } = await sbClient.from('guest_list').select('name');
  const existingNormalized = new Set((existing || []).map(e => normalize(e.name)));
  const newNames = [...new Set(lines)].filter(l => !existingNormalized.has(normalize(l)));
  if (newNames.length) {
    await sbClient.from('guest_list').insert(newNames.map(name => ({ name })));
  }
  $('#guestListInput').value = '';
  renderGuestList();
}

async function removeGuestListEntry(id) {
  await sbClient.from('guest_list').delete().eq('id', id);
  renderGuestList();
}
window.removeGuestListEntry = removeGuestListEntry;

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
$('#saveGuestList').onclick = saveGuestList;

sbClient.auth.getSession().then(({ data: { session } }) => { if (session) unlock() });
