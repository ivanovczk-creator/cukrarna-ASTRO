/*
 * Decap CMS – vlastní widget "blocked-calendar"
 * Klikací měsíční kalendář pro správu dnů s plnou kapacitou dortů.
 *
 * Data (src/data/blocked-dates.json) zůstávají ve stejném formátu jako dřív:
 *   { "dates": [ { "date": "YYYY-MM-DD" }, ... ] }
 * Widget umí načíst i prosté řetězce "YYYY-MM-DD".
 */
(function () {
  var h = window.h;
  var createClass = window.createClass;
  if (!window.CMS || !h || !createClass) {
    console.error('blocked-calendar: Decap CMS nebo její pomocné funkce (h, createClass) nejsou k dispozici.');
    return;
  }

  var MONTHS = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
  var WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  var ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
  var RED = '#dc2626';

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function iso(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function todayIso() { var t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); }

  function formatCz(isoDate) {
    var p = isoDate.split('-');
    return Number(p[2]) + '. ' + Number(p[1]) + '. ' + p[0];
  }

  // Immutable / pole řetězců / pole objektů {date} -> seřazené unikátní pole "YYYY-MM-DD"
  function readDates(value) {
    var raw = value && typeof value.toJS === 'function' ? value.toJS() : value;
    if (!Array.isArray(raw)) return [];
    var seen = {};
    var out = [];
    raw.forEach(function (entry) {
      var s = String(typeof entry === 'string' ? entry : (entry && entry.date) || '').slice(0, 10);
      if (ISO_RE.test(s) && !seen[s]) { seen[s] = true; out.push(s); }
    });
    return out.sort();
  }

  function toValue(dates) {
    return dates.slice().sort().map(function (d) { return { date: d }; });
  }

  var navBtn = {
    padding: '6px 12px', border: '1px solid #d4d4d8', borderRadius: '6px', background: '#fff',
    cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#18181b'
  };

  var BlockedCalendarControl = createClass({
    getInitialState: function () {
      var t = new Date();
      return { year: t.getFullYear(), month: t.getMonth() };
    },

    shift: function (delta) {
      var d = new Date(this.state.year, this.state.month + delta, 1);
      this.setState({ year: d.getFullYear(), month: d.getMonth() });
    },

    goToday: function () {
      var t = new Date();
      this.setState({ year: t.getFullYear(), month: t.getMonth() });
    },

    toggle: function (isoDate) {
      var dates = readDates(this.props.value);
      var idx = dates.indexOf(isoDate);
      if (idx >= 0) dates.splice(idx, 1); else dates.push(isoDate);
      this.props.onChange(toValue(dates));
    },

    removePast: function () {
      var today = todayIso();
      var dates = readDates(this.props.value).filter(function (d) { return d >= today; });
      this.props.onChange(toValue(dates));
    },

    renderMonth: function (year, month, selected, today) {
      var self = this;
      var first = new Date(year, month, 1);
      var lead = (first.getDay() + 6) % 7; // pondělí = 0
      var count = new Date(year, month + 1, 0).getDate();
      var cells = [];

      WEEKDAYS.forEach(function (w, i) {
        cells.push(h('div', {
          key: 'w' + i,
          style: { textAlign: 'center', fontSize: '11px', fontWeight: 700, color: i > 4 ? '#a1a1aa' : '#71717a', padding: '4px 0' }
        }, w));
      });
      for (var i = 0; i < lead; i++) cells.push(h('div', { key: 'e' + i }));

      var _loop = function (d) {
        var key = iso(year, month, d);
        var isBlocked = selected.indexOf(key) >= 0;
        var isToday = key === today;
        var isPast = key < today;
        cells.push(h('button', {
          key: key,
          type: 'button',
          title: isBlocked ? 'Plná kapacita dortů – klikněte pro odblokování' : 'Klikněte pro zablokování dortů',
          'aria-pressed': isBlocked ? 'true' : 'false',
          'aria-label': formatCz(key) + (isBlocked ? ' – plná kapacita dortů' : ''),
          onClick: function () { self.toggle(key); },
          style: {
            height: '36px', border: isToday ? '2px solid #18181b' : '1px solid ' + (isBlocked ? RED : '#e4e4e7'),
            borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            fontWeight: isBlocked ? 700 : 500,
            background: isBlocked ? RED : '#fff',
            color: isBlocked ? '#fff' : (isPast ? '#d4d4d8' : '#18181b')
          }
        }, String(d)));
      };
      for (var d = 1; d <= count; d++) _loop(d);

      return h('div', { key: year + '-' + month, style: { flex: '1 1 260px', minWidth: '260px', maxWidth: '340px' } },
        h('div', { style: { textAlign: 'center', fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#18181b' } },
          MONTHS[month] + ' ' + year),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' } }, cells)
      );
    },

    render: function () {
      var self = this;
      var selected = readDates(this.props.value);
      var today = todayIso();
      var s = this.state;
      var next = new Date(s.year, s.month + 1, 1);
      var pastCount = selected.filter(function (d) { return d < today; }).length;

      var chips = selected.map(function (d) {
        return h('span', {
          key: d,
          style: {
            display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#991b1b',
            borderRadius: '999px', padding: '2px 4px 2px 10px', fontSize: '12px', fontWeight: 600
          }
        },
          formatCz(d),
          h('button', {
            type: 'button', 'aria-label': 'Odebrat ' + formatCz(d), title: 'Odebrat',
            onClick: function () { self.toggle(d); },
            style: { border: 'none', background: 'transparent', color: '#991b1b', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '2px 6px' }
          }, '×'));
      });

      return h('div', { id: this.props.forID, className: this.props.classNameWrapper, style: { padding: '12px 0' } },
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' } },
          h('button', { type: 'button', onClick: function () { self.shift(-1); }, style: navBtn, 'aria-label': 'Předchozí měsíc' }, '‹ Předchozí'),
          h('button', { type: 'button', onClick: function () { self.goToday(); }, style: navBtn }, 'Dnes'),
          h('button', { type: 'button', onClick: function () { self.shift(1); }, style: navBtn, 'aria-label': 'Následující měsíc' }, 'Další ›'),
          h('span', { style: { marginLeft: 'auto', fontSize: '12px', color: '#71717a', display: 'inline-flex', alignItems: 'center', gap: '6px' } },
            h('span', { style: { display: 'inline-block', width: '12px', height: '12px', background: RED, borderRadius: '3px' } }),
            'plná kapacita dortů')
        ),
        h('div', { style: { display: 'flex', gap: '24px', flexWrap: 'wrap' } },
          this.renderMonth(s.year, s.month, selected, today),
          this.renderMonth(next.getFullYear(), next.getMonth(), selected, today)
        ),
        h('div', { style: { marginTop: '14px' } },
          h('div', { style: { fontSize: '12px', fontWeight: 700, color: '#52525b', marginBottom: '6px' } },
            'Zablokované dny: ' + selected.length),
          selected.length
            ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } }, chips)
            : h('div', { style: { fontSize: '12px', color: '#a1a1aa' } }, 'Zatím není zablokován žádný den.'),
          pastCount > 0
            ? h('button', {
                type: 'button', onClick: function () { self.removePast(); },
                style: Object.assign({}, navBtn, { marginTop: '10px', fontSize: '12px' })
              }, 'Odebrat uplynulá data (' + pastCount + ')')
            : null
        )
      );
    }
  });

  window.CMS.registerWidget('blocked-calendar', BlockedCalendarControl);
})();
