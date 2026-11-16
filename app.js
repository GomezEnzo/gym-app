// ============================================
// GymTurnos - Mockup SPA
// ============================================

const PLANS = {
  basico: { name: 'Basico', cupos: 8 },
  intermedio: { name: 'Intermedio', cupos: 12 },
  avanzado: { name: 'Avanzado', cupos: 18 },
  full: { name: 'Full', cupos: 20 }
};

const WEEKDAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const HOURS_LV = [9, 10, 11, 12, 16, 17, 18, 19, 20];
const HOURS_S = [9, 10, 11, 12];

let users = [
  { id: 1, name: 'Admin Gym', email: 'admin@gym.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Juan Perez', email: 'juan@mail.com', password: '123456', role: 'client', plan: 'intermedio', cuposTotal: 12, cuposUsados: 4, vencimiento: '2026-12-10' },
  { id: 3, name: 'Maria Lopez', email: 'maria@mail.com', password: '123456', role: 'client', plan: 'basico', cuposTotal: 8, cuposUsados: 2, vencimiento: '2026-12-05' },
  { id: 4, name: 'Carlos Ruiz', email: 'carlos@mail.com', password: '123456', role: 'client', plan: 'full', cuposTotal: 20, cuposUsados: 7, vencimiento: '2026-12-15' },
  { id: 5, name: 'Ana Gomez', email: 'ana@mail.com', password: '123456', role: 'client', plan: 'avanzado', cuposTotal: 18, cuposUsados: 0, vencimiento: '2026-12-20' }
];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const dates = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const weekDates = getWeekDates();

function generateSlots() {
  const slots = [];
  let id = 1;
  weekDates.forEach((date, dayIdx) => {
    const hours = dayIdx === 5 ? HOURS_S : HOURS_LV;
    hours.forEach(h => {
      slots.push({ id: id++, date: formatDate(date), dayIdx, hour: h, capacity: 5, reserved: [] });
    });
  });
  return slots;
}

let slots = generateSlots();

function seedReservations() {
  slots.filter(s => s.dayIdx < 3 && s.hour >= 16).slice(0, 4).forEach(s => { if (!s.reserved.includes(2)) s.reserved.push(2); });
  slots.filter(s => s.dayIdx === 0 || s.dayIdx === 2).slice(0, 2).forEach(s => { if (!s.reserved.includes(3)) s.reserved.push(3); });
  slots.filter(s => s.hour === 10 || s.hour === 18).slice(0, 7).forEach(s => { if (!s.reserved.includes(4)) s.reserved.push(4); });
}
seedReservations();

function formatDate(d) { return d.toISOString().slice(0, 10); }
function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}
function formatHour(h) { return String(h).padStart(2, '0') + ':00'; }
function getCuposDisponibles(user) { return user.cuposTotal - user.cuposUsados; }
function getUserById(id) { return users.find(u => u.id === id); }
function getSlotById(id) { return slots.find(s => s.id === id); }
function getUserReservations(userId) { return slots.filter(s => s.reserved.includes(userId)); }
function canEditReservation(slot) {
  const now = new Date();
  const slotDate = new Date(slot.date + 'T' + String(slot.hour).padStart(2, '0') + ':00:00');
  return (slotDate - now) > 30 * 60 * 1000;
}
function canBookSlot(slot) {
  const now = new Date();
  const slotDate = new Date(slot.date + 'T' + String(slot.hour).padStart(2, '0') + ':00:00');
  return (slotDate - now) > 12 * 60 * 60 * 1000;
}

let currentUser = null;
let selectedSlots = new Set();
let currentDayIdx = 0;

function showToast(msg, type) {
  type = type || 'info';
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3200);
}

function navigate(screen, data) {
  data = data || {};
  const app = document.getElementById('app');
  app.innerHTML = '';
  const screens = {
    login: renderLogin,
    register: renderRegister,
    forgot: renderForgot,
    clientDashboard: renderClientDashboard,
    clientBook: renderClientBook,
    clientReservations: renderClientReservations,
    adminWeek: renderAdminWeek,
    adminDay: function() { return renderAdminDay(data.dayIdx != null ? data.dayIdx : currentDayIdx); },
    adminSearch: renderAdminSearch,
    adminUser: function() { return renderAdminUser(data.userId); }
  };
  const fn = screens[screen];
  if (fn) {
    const el = document.createElement('div');
    el.className = 'screen active';
    el.innerHTML = fn();
    app.appendChild(el);
    bindEvents(screen, data);
  }
}

function bindEvents(screen, data) {
  document.querySelectorAll('[data-action="logout"]').forEach(function(btn) {
    btn.onclick = function() {
      currentUser = null;
      selectedSlots.clear();
      navigate('login');
      showToast('Sesion cerrada', 'info');
    };
  });

  if (screen === 'login') {
    var form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('email').value.trim().toLowerCase();
      var pass = document.getElementById('password').value;
      var user = users.find(function(u) { return u.email === email && u.password === pass; });
      if (user) {
        currentUser = user;
        showToast('Bienvenido ' + user.name, 'success');
        if (user.role === 'admin') navigate('adminWeek');
        else navigate('clientDashboard');
      } else {
        showToast('Email o contrasena incorrectos', 'error');
      }
    });
    var r = document.querySelector('[data-goto="register"]');
    if (r) r.addEventListener('click', function() { navigate('register'); });
    var f = document.querySelector('[data-goto="forgot"]');
    if (f) f.addEventListener('click', function() { navigate('forgot'); });
  }

  if (screen === 'register') {
    var rf = document.getElementById('registerForm');
    if (rf) rf.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('regName').value.trim();
      var email = document.getElementById('regEmail').value.trim().toLowerCase();
      var pass = document.getElementById('regPassword').value;
      if (users.some(function(u) { return u.email === email; })) {
        showToast('Ese email ya esta registrado', 'error');
        return;
      }
      var newUser = { id: users.length + 1, name: name, email: email, password: pass, role: 'client', plan: null, cuposTotal: 0, cuposUsados: 0, vencimiento: null };
      users.push(newUser);
      currentUser = newUser;
      showToast('Cuenta creada. Espera que el admin te asigne un plan.', 'success');
      navigate('clientDashboard');
    });
    var l = document.querySelector('[data-goto="login"]');
    if (l) l.addEventListener('click', function() { navigate('login'); });
  }

  if (screen === 'forgot') {
    var ff = document.getElementById('forgotForm');
    if (ff) ff.addEventListener('submit', function(e) {
      e.preventDefault();
      showToast('Si el email existe, recibiras un link de recuperacion (simulado)', 'success');
      setTimeout(function() { navigate('login'); }, 1500);
    });
    var bl = document.querySelector('[data-goto="login"]');
    if (bl) bl.addEventListener('click', function() { navigate('login'); });
  }

  if (screen === 'clientDashboard') {
    var book = document.querySelector('[data-goto="book"]');
    if (book) book.addEventListener('click', function() { selectedSlots.clear(); navigate('clientBook'); });
    var res = document.querySelector('[data-goto="reservations"]');
    if (res) res.addEventListener('click', function() { navigate('clientReservations'); });
  }

  if (screen === 'clientBook') {
    document.querySelectorAll('.slot-btn:not(.disabled)').forEach(function(btn) {
      btn.onclick = function() {
        var id = Number(btn.dataset.id);
        if (selectedSlots.has(id)) {
          selectedSlots.delete(id);
          btn.classList.remove('selected');
        } else {
          var disp = getCuposDisponibles(currentUser);
          if (selectedSlots.size >= disp) {
            showToast('Solo te quedan ' + disp + ' cupos', 'error');
            return;
          }
          selectedSlots.add(id);
          btn.classList.add('selected');
        }
        updateBookSummary();
      };
    });
    var save = document.getElementById('saveDistribution');
    if (save) save.addEventListener('click', function() {
      if (selectedSlots.size === 0) {
        showToast('Selecciona al menos un turno', 'error');
        return;
      }
      selectedSlots.forEach(function(id) {
        var slot = getSlotById(id);
        if (slot && !slot.reserved.includes(currentUser.id) && slot.reserved.length < 5) {
          slot.reserved.push(currentUser.id);
          currentUser.cuposUsados++;
        }
      });
      selectedSlots.clear();
      showToast('Distribucion guardada. Se notifico al admin por email.', 'success');
      navigate('clientDashboard');
    });
    var back = document.querySelector('[data-goto="dashboard"]');
    if (back) back.addEventListener('click', function() { navigate('clientDashboard'); });
  }

  if (screen === 'clientReservations') {
    document.querySelectorAll('[data-cancel]').forEach(function(btn) {
      btn.onclick = function() {
        var slotId = Number(btn.dataset.cancel);
        var slot = getSlotById(slotId);
        if (!slot) return;
        if (!canEditReservation(slot)) {
          showToast('No se puede cancelar con menos de 30 minutos de anticipacion', 'error');
          return;
        }
        slot.reserved = slot.reserved.filter(function(id) { return id !== currentUser.id; });
        currentUser.cuposUsados = Math.max(0, currentUser.cuposUsados - 1);
        showToast('Turno cancelado. Cupo devuelto.', 'success');
        navigate('clientReservations');
      };
    });
    var bd = document.querySelector('[data-goto="dashboard"]');
    if (bd) bd.addEventListener('click', function() { navigate('clientDashboard'); });
  }

  if (screen === 'adminWeek') {
    document.querySelectorAll('.day-card').forEach(function(card) {
      card.onclick = function() {
        currentDayIdx = Number(card.dataset.day);
        navigate('adminDay', { dayIdx: currentDayIdx });
      };
    });
    var search = document.querySelector('[data-goto="search"]');
    if (search) search.addEventListener('click', function() { navigate('adminSearch'); });
  }

  if (screen === 'adminDay') {
    var week = document.querySelector('[data-goto="week"]');
    if (week) week.addEventListener('click', function() { navigate('adminWeek'); });
    document.querySelectorAll('[data-remove-user]').forEach(function(btn) {
      btn.onclick = function() {
        var slotId = Number(btn.dataset.slot);
        var userId = Number(btn.dataset.removeUser);
        var slot = getSlotById(slotId);
        if (!slot) return;
        slot.reserved = slot.reserved.filter(function(id) { return id !== userId; });
        var u = getUserById(userId);
        if (u) {
          u.cuposUsados = Math.max(0, u.cuposUsados - 1);
          showToast('Se elimino a ' + u.name + ' del turno. Se le notifico por email.', 'success');
        }
        navigate('adminDay', { dayIdx: currentDayIdx });
      };
    });
    var empty = document.getElementById('emptyDay');
    if (empty) empty.addEventListener('click', function() {
      var daySlots = slots.filter(function(s) { return s.dayIdx === currentDayIdx; });
      var affected = 0;
      daySlots.forEach(function(slot) {
        slot.reserved.forEach(function(uid) {
          var u = getUserById(uid);
          if (u) { u.cuposUsados = Math.max(0, u.cuposUsados - 1); affected++; }
        });
        slot.reserved = [];
      });
      showToast('Dia vaciado. Se notifico a ' + affected + ' personas por email.', 'success');
      navigate('adminDay', { dayIdx: currentDayIdx });
    });
  }

  if (screen === 'adminSearch') {
    var sf = document.getElementById('searchForm');
    if (sf) sf.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('searchEmail').value.trim().toLowerCase();
      var user = users.find(function(u) { return u.email === email && u.role === 'client'; });
      if (user) navigate('adminUser', { userId: user.id });
      else showToast('No se encontro ningun cliente con ese email', 'error');
    });
    var w = document.querySelector('[data-goto="week"]');
    if (w) w.addEventListener('click', function() { navigate('adminWeek'); });
  }

  if (screen === 'adminUser') {
    var userId = data.userId;
    var ap = document.getElementById('assignPlan');
    if (ap) ap.addEventListener('click', function() {
      var planKey = document.getElementById('planSelect').value;
      var user = getUserById(userId);
      if (!user || !planKey) return;
      user.plan = planKey;
      user.cuposTotal = PLANS[planKey].cupos;
      user.cuposUsados = 0;
      var venc = new Date();
      venc.setDate(venc.getDate() + 30);
      user.vencimiento = formatDate(venc);
      showToast('Plan ' + PLANS[planKey].name + ' asignado. Se notifico al cliente por email.', 'success');
      navigate('adminUser', { userId: userId });
    });
    var addC = document.getElementById('addCupos');
    if (addC) addC.addEventListener('click', function() {
      var user = getUserById(userId);
      var amount = Number(document.getElementById('cuposAmount').value) || 1;
      user.cuposTotal += amount;
      showToast('Se sumaron ' + amount + ' cupos. Se notifico al cliente.', 'success');
      navigate('adminUser', { userId: userId });
    });
    var remC = document.getElementById('removeCupos');
    if (remC) remC.addEventListener('click', function() {
      var user = getUserById(userId);
      var amount = Number(document.getElementById('cuposAmount').value) || 1;
      user.cuposTotal = Math.max(user.cuposUsados, user.cuposTotal - amount);
      showToast('Se restaron cupos. Se notifico al cliente.', 'success');
      navigate('adminUser', { userId: userId });
    });
    var s = document.querySelector('[data-goto="search"]');
    if (s) s.addEventListener('click', function() { navigate('adminSearch'); });
    var wk = document.querySelector('[data-goto="week"]');
    if (wk) wk.addEventListener('click', function() { navigate('adminWeek'); });
  }
}

function updateBookSummary() {
  var el = document.getElementById('bookSummary');
  if (el) el.textContent = 'Seleccionados: ' + selectedSlots.size + ' turno(s)';
}

function renderLogin() {
  return '<div class="auth-container"><h1>GymTurnos</h1><p class="subtitle">Sistema de reservas del gimnasio</p><div class="card"><form id="loginForm"><div class="form-group"><label>Email</label><input type="email" id="email" required placeholder="juan@mail.com" value="juan@mail.com" /></div><div class="form-group"><label>Contrasena</label><input type="password" id="password" required placeholder="••••••" value="123456" /></div><button type="submit" class="btn btn-primary btn-block">Ingresar</button></form><div class="auth-links"><a data-goto="register">Crear cuenta</a> · <a data-goto="forgot">Olvide mi contrasena</a></div></div><div class="card mt-2" style="font-size:0.85rem;color:var(--text-muted)"><strong>Cuentas de prueba:</strong><br>Cliente: juan@mail.com / 123456<br>Admin: admin@gym.com / admin123</div></div>';
}

function renderRegister() {
  return '<div class="auth-container"><h1>Crear cuenta</h1><p class="subtitle">Registrate para empezar</p><div class="card"><form id="registerForm"><div class="form-group"><label>Nombre</label><input type="text" id="regName" required placeholder="Tu nombre" /></div><div class="form-group"><label>Email</label><input type="email" id="regEmail" required placeholder="tu@email.com" /></div><div class="form-group"><label>Contrasena</label><input type="password" id="regPassword" required minlength="6" placeholder="Minimo 6 caracteres" /></div><button type="submit" class="btn btn-primary btn-block">Registrarme</button></form><div class="auth-links"><a data-goto="login">Ya tengo cuenta</a></div></div></div>';
}

function renderForgot() {
  return '<div class="auth-container"><h1>Recuperar contrasena</h1><p class="subtitle">Te enviaremos un link (simulado)</p><div class="card"><form id="forgotForm"><div class="form-group"><label>Email</label><input type="email" id="forgotEmail" required placeholder="tu@email.com" /></div><button type="submit" class="btn btn-primary btn-block">Enviar link</button></form><div class="auth-links"><a data-goto="login">Volver al login</a></div></div></div>';
}

function renderClientDashboard() {
  var u = currentUser;
  var hasPlan = !!u.plan;
  var disp = getCuposDisponibles(u);
  var html = '<div class="header"><h1>Hola, ' + u.name + '</h1><div class="user-info"><span class="badge">Cliente</span><button class="btn btn-outline btn-sm" data-action="logout">Salir</button></div></div>';
  if (hasPlan) {
    html += '<div class="stats"><div class="stat"><div class="value">' + PLANS[u.plan].name + '</div><div class="label">Plan actual</div></div><div class="stat"><div class="value">' + disp + '</div><div class="label">Cupos disponibles</div></div><div class="stat"><div class="value">' + u.cuposUsados + '</div><div class="label">Cupos usados</div></div><div class="stat"><div class="value">' + (u.vencimiento ? formatDisplayDate(u.vencimiento) : '-') + '</div><div class="label">Vence</div></div></div>';
  } else {
    html += '<div class="card"><h3>Sin plan asignado</h3><p class="text-muted">El administrador aun no te asigno un plan. Cuando lo haga vas a poder reservar turnos.</p></div>';
  }
  html += '<div class="nav-tabs"><button class="btn btn-outline" data-goto="book"' + (!hasPlan ? ' disabled' : '') + '>Distribuir cupos</button><button class="btn btn-outline" data-goto="reservations">Mis reservas</button></div><div class="card"><h3>Informacion</h3><p class="text-muted" style="font-size:0.9rem">• Podes reservar con minimo 12 horas de anticipacion.<br>• Podes editar/cancelar hasta 30 minutos antes del turno.<br>• Al guardar la distribucion se notifica al admin por email.</p></div>';
  return html;
}

function renderClientBook() {
  var u = currentUser;
  var disp = getCuposDisponibles(u);
  var html = '<div class="header"><h1>Distribuir cupos</h1><div class="user-info"><span>Disponibles: <strong>' + disp + '</strong></span><button class="btn btn-outline btn-sm" data-goto="dashboard">Volver</button></div></div>';
  weekDates.forEach(function(date, dayIdx) {
    var daySlots = slots.filter(function(s) { return s.dayIdx === dayIdx; });
    html += '<div class="card"><h3>' + WEEKDAYS[dayIdx] + ' · ' + formatDisplayDate(formatDate(date)) + '</h3><div class="available-slots">';
    daySlots.forEach(function(slot) {
      var isFull = slot.reserved.length >= 5;
      var alreadyMine = slot.reserved.includes(u.id);
      var tooLate = !canBookSlot(slot);
      var disabled = isFull || alreadyMine || tooLate;
      var selected = selectedSlots.has(slot.id);
      html += '<div class="slot-btn' + (disabled ? ' disabled' : '') + (selected ? ' selected' : '') + '" data-id="' + slot.id + '"><span class="slot-time">' + formatHour(slot.hour) + '</span><span class="slot-cap">' + slot.reserved.length + '/5' + (alreadyMine ? ' (tuyo)' : isFull ? ' (lleno)' : tooLate ? ' (cerrado)' : '') + '</span></div>';
    });
    html += '</div></div>';
  });
  html += '<div class="card flex-between"><span id="bookSummary">Seleccionados: 0 turno(s)</span><button class="btn btn-success" id="saveDistribution">Guardar distribucion</button></div>';
  return html;
}

function renderClientReservations() {
  var res = getUserReservations(currentUser.id);
  var html = '<div class="header"><h1>Mis reservas</h1><button class="btn btn-outline btn-sm" data-goto="dashboard">Volver</button></div>';
  if (res.length === 0) {
    html += '<div class="card empty-state">No tenes reservas activas</div>';
  } else {
    html += '<div class="card"><div class="slots-list">';
    res.sort(function(a, b) { return a.date.localeCompare(b.date) || a.hour - b.hour; });
    res.forEach(function(slot) {
      var canEdit = canEditReservation(slot);
      html += '<div class="slot"><div><span class="time">' + formatDisplayDate(slot.date) + ' · ' + formatHour(slot.hour) + '</span></div><div>' + (canEdit ? '<button class="btn btn-danger btn-sm" data-cancel="' + slot.id + '">Cancelar</button>' : '<span class="text-muted" style="font-size:0.8rem">No editable (<30min)</span>') + '</div></div>';
    });
    html += '</div></div>';
  }
  return html;
}

function renderAdminWeek() {
  var html = '<div class="header"><h1>Vista semanal</h1><div class="user-info"><span class="badge admin">Admin</span><button class="btn btn-outline btn-sm" data-goto="search">Buscar usuario</button><button class="btn btn-outline btn-sm" data-action="logout">Salir</button></div></div><div class="week-grid">';
  weekDates.forEach(function(date, dayIdx) {
    var daySlots = slots.filter(function(s) { return s.dayIdx === dayIdx; });
    var totalCap = daySlots.length * 5;
    var used = daySlots.reduce(function(sum, s) { return sum + s.reserved.length; }, 0);
    var pct = totalCap ? Math.round((used / totalCap) * 100) : 0;
    var statusClass = 'empty';
    if (pct > 70) statusClass = 'full';
    else if (pct > 30) statusClass = 'medium';
    html += '<div class="day-card ' + statusClass + '" data-day="' + dayIdx + '"><div class="day-name">' + WEEKDAYS[dayIdx] + '</div><div class="day-date">' + formatDisplayDate(formatDate(date)) + '</div><div class="ocupacion">' + used + ' / ' + totalCap + '</div><div class="text-muted" style="font-size:0.75rem">' + pct + '% ocupado</div></div>';
  });
  html += '</div><div class="card mt-2"><p class="text-muted" style="font-size:0.9rem">Hace click en un dia para ver el detalle de turnos y gestionar reservas.</p></div>';
  return html;
}

function renderAdminDay(dayIdx) {
  var date = weekDates[dayIdx];
  var daySlots = slots.filter(function(s) { return s.dayIdx === dayIdx; });
  var html = '<div class="header"><h1>' + WEEKDAYS[dayIdx] + ' · ' + formatDisplayDate(formatDate(date)) + '</h1><div class="user-info"><button class="btn btn-outline btn-sm" data-goto="week">← Semana</button><button class="btn btn-danger btn-sm" id="emptyDay">Vaciar dia</button></div></div><div class="slots-list">';
  daySlots.forEach(function(slot) {
    var people = slot.reserved.map(function(uid) {
      var u = getUserById(uid);
      return u ? u.name : 'Usuario';
    });
    html += '<div class="slot' + (slot.reserved.length >= 5 ? ' full' : '') + '"><div><span class="time">' + formatHour(slot.hour) + '</span><span class="capacity"> · ' + slot.reserved.length + '/5</span></div><div class="people">';
    if (people.length) {
      html += people.map(function(name, i) {
        return '<span>' + name + ' <button class="btn btn-danger btn-sm" style="padding:2px 6px;font-size:0.7rem" data-slot="' + slot.id + '" data-remove-user="' + slot.reserved[i] + '">×</button></span>';
      }).join(' · ');
    } else {
      html += '<span class="text-muted">Sin reservas</span>';
    }
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

function renderAdminSearch() {
  return '<div class="header"><h1>Buscar cuenta</h1><button class="btn btn-outline btn-sm" data-goto="week">← Semana</button></div><div class="card" style="max-width:480px"><form id="searchForm"><div class="form-group"><label>Email del cliente</label><input type="email" id="searchEmail" required placeholder="juan@mail.com" value="juan@mail.com" /></div><button type="submit" class="btn btn-primary">Buscar</button></form></div><div class="card mt-2"><h3>Clientes de prueba</h3><p class="text-muted" style="font-size:0.9rem">juan@mail.com · maria@mail.com · carlos@mail.com · ana@mail.com</p></div>';
}

function renderAdminUser(userId) {
  var u = getUserById(userId);
  if (!u) return '<div class="card">Usuario no encontrado</div>';
  var planName = u.plan ? PLANS[u.plan].name : 'Sin plan';
  var html = '<div class="header"><h1>' + u.name + '</h1><div class="user-info"><button class="btn btn-outline btn-sm" data-goto="search">← Buscar</button><button class="btn btn-outline btn-sm" data-goto="week">Semana</button></div></div>';
  html += '<div class="stats"><div class="stat"><div class="value">' + planName + '</div><div class="label">Plan</div></div><div class="stat"><div class="value">' + (u.cuposTotal - u.cuposUsados) + '</div><div class="label">Cupos disp.</div></div><div class="stat"><div class="value">' + u.cuposUsados + ' / ' + u.cuposTotal + '</div><div class="label">Usados / Total</div></div><div class="stat"><div class="value">' + (u.vencimiento ? formatDisplayDate(u.vencimiento) : '-') + '</div><div class="label">Vencimiento</div></div></div>';
  html += '<div class="grid-2"><div class="card"><h3>Asignar / Cambiar plan</h3><div class="form-group"><label>Plan</label><select id="planSelect"><option value="">Seleccionar...</option><option value="basico">Basico (8)</option><option value="intermedio">Intermedio (12)</option><option value="avanzado">Avanzado (18)</option><option value="full">Full (20)</option></select></div><button class="btn btn-primary" id="assignPlan">Asignar plan</button><p class="text-muted mt-1" style="font-size:0.8rem">Al asignar se setea vencimiento a +30 dias y se resetean cupos usados.</p></div>';
  html += '<div class="card"><h3>Ajustar cupos</h3><div class="form-group"><label>Cantidad</label><input type="number" id="cuposAmount" value="1" min="1" max="20" /></div><div class="flex"><button class="btn btn-success" id="addCupos">Sumar</button><button class="btn btn-danger" id="removeCupos">Restar</button></div><p class="text-muted mt-1" style="font-size:0.8rem">La fecha de vencimiento se mantiene.</p></div></div>';
  html += '<div class="card"><h3>Reservas del cliente</h3>';
  var res = getUserReservations(u.id);
  if (!res.length) html += '<p class="text-muted">Sin reservas</p>';
  else {
    html += '<ul style="list-style:none">';
    res.forEach(function(s) {
      html += '<li style="padding:6px 0;border-bottom:1px solid var(--border)">' + formatDisplayDate(s.date) + ' · ' + formatHour(s.hour) + '</li>';
    });
    html += '</ul>';
  }
  html += '</div>';
  return html;
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() { navigate('login'); }, 400);
});
