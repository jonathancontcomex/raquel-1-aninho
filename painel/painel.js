const $ = s => document.querySelector(s);

const STOPWORDS = ['familia', 'família', 'sr', 'sra', 'sr.', 'sra.', 'dona', 'senhor', 'senhora', 'e'];

function fullName(p) { return `${p.first} ${p.last}`.trim() }

function normalize(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function significantWords(name) {
  return normalize(name).split(/\s+/).filter(w => w.length >= 2 && !STOPWORDS.includes(w));
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/`/g, '&#96;');
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
    return `<tr><td>${escapeHtml(fullName(host))}</td><td>${(x.people || []).slice(1).map(p => escapeHtml(fullName(p))).join(', ') || '-'}</td><td><span class="tag">${x.status === 'confirmed' ? 'Confirmado' : 'Não irá'}</span></td><td>${new Date(x.created_at).toLocaleString('pt-BR')}</td></tr>`;
  }).join('') || '<tr><td colspan="4">Nenhuma confirmação ainda.</td></tr>';
  renderGuestList();
}

// -- lista de convidados x confirmados, com confirmação manual --

function allConfirmedPeople() {
  return rsvpsData
    .filter(r => r.status === 'confirmed')
    .flatMap(r => (r.people || []).map(p => ({ rsvpId: r.id, personName: fullName(p), hostName: fullName({ first: r.host_first, last: r.host_last }) })));
}

function candidatesFor(guestName, usedKeys) {
  const words = significantWords(guestName);
  if (!words.length) return [];
  return allConfirmedPeople().filter(p => {
    const key = `${p.rsvpId}::${p.personName}`;
    if (usedKeys.has(key)) return false;
    return words.every(w => normalize(p.personName).includes(w));
  });
}

async function renderGuestList() {
  const { data, error } = await sbClient.from('guest_list').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return }

  const usedKeys = new Set(data.filter(r => r.matched_rsvp_id).map(r => `${r.matched_rsvp_id}::${r.matched_person_name}`));

  $('#glTotal').textContent = data.length;
  $('#glConfirmed').textContent = data.filter(r => r.matched_rsvp_id).length;
  $('#glPending').textContent = data.filter(r => !r.matched_rsvp_id).length;

  $('#guestListRows').innerHTML = data.map(r => {
    const nameCell = escapeHtml(r.name);
    let statusCell;
    if (r.matched_rsvp_id) {
      statusCell = `<div class="gl-matched"><span class="gl-tag ok">✓ ${escapeHtml(r.matched_person_name)}</span><button class="gl-undo" data-action="unmatch" data-gl-id="${r.id}">Desfazer</button></div>`;
    } else {
      const candidates = candidatesFor(r.name, usedKeys);
      if (candidates.length) {
        statusCell = `<div class="gl-suggestions">${candidates.map(c => `<button class="gl-suggest-btn" data-action="confirm" data-gl-id="${r.id}" data-rsvp-id="${c.rsvpId}" data-person="${escapeAttr(c.personName)}">${escapeHtml(c.personName)} — confirmar</button>`).join('')}</div>`;
      } else {
        statusCell = `<span class="gl-none">Sem correspondência ainda</span>`;
      }
    }
    return `<tr><td>${nameCell}</td><td>${statusCell}</td><td><button class="gl-del" data-action="remove" data-gl-id="${r.id}" title="Remover da lista">✕</button></td></tr>`;
  }).join('') || '<tr><td colspan="3">Nenhum nome na lista ainda.</td></tr>';

  const unmatchedPeople = allConfirmedPeople().filter(p => !usedKeys.has(`${p.rsvpId}::${p.personName}`));
  $('#unmatchedRows').innerHTML = unmatchedPeople.map(p => `<tr><td>${escapeHtml(p.personName)}</td><td>${escapeHtml(p.hostName)}</td><td><button class="gl-add-person-btn" data-action="addmatch" data-rsvp-id="${p.rsvpId}" data-person="${escapeAttr(p.personName)}" title="Adicionar à lista já confirmado">+</button></td></tr>`).join('') || '<tr><td colspan="3">Todo mundo confirmado já está na sua lista.</td></tr>';
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

async function confirmMatch(glId, rsvpId, personName) {
  await sbClient.from('guest_list').update({ matched_rsvp_id: rsvpId, matched_person_name: personName }).eq('id', glId);
  renderGuestList();
}

async function unmatchGuest(glId) {
  await sbClient.from('guest_list').update({ matched_rsvp_id: null, matched_person_name: null }).eq('id', glId);
  renderGuestList();
}

async function removeGuestListEntry(id) {
  await sbClient.from('guest_list').delete().eq('id', id);
  renderGuestList();
}

async function addAndMatch(rsvpId, personName) {
  await sbClient.from('guest_list').insert([{ name: personName, matched_rsvp_id: rsvpId, matched_person_name: personName }]);
  renderGuestList();
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'remove') removeGuestListEntry(btn.dataset.glId);
  else if (action === 'unmatch') unmatchGuest(btn.dataset.glId);
  else if (action === 'confirm') confirmMatch(btn.dataset.glId, btn.dataset.rsvpId, btn.dataset.person);
  else if (action === 'addmatch') addAndMatch(btn.dataset.rsvpId, btn.dataset.person);
});

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
