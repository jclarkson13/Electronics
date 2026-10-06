import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, Pressable, StyleSheet, StatusBar, Platform } from 'react-native';

import Inventory from './Inventory';

const T = { bg: '#17211E', card: '#223029', ink: '#E9EBDD', mute: '#8FA39A', brass: '#D9A441', line: '#2F4239' };

// ---------- helpers ----------
const SI = { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9, '': 1 };
function parseVal(s) {
  const m = String(s).trim().match(/^(\d*\.?\d+)\s*([pnuµmkKMG]?)/);
  return m ? parseFloat(m[1]) * SI[m[2]] : NaN;
}
function fmt(v, unit = 'Ω') {
  if (!isFinite(v)) return '—';
  if (v === 0) return `0 ${unit}`;
  const a = Math.abs(v);
  const steps = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  for (const [k, p] of steps) if (a >= k * 0.9999999) return `${+(v / k).toPrecision(4)} ${p}${unit}`;
  return `${v.toExponential(2)} ${unit}`;
}
const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
function nextE24(r) {
  const dec = Math.pow(10, Math.floor(Math.log10(r)));
  const n = r / dec;
  const hit = E24.find((x) => x >= n * 0.9999);
  return (hit ?? 10) * dec;
}

// ---------- shared UI ----------
function Field({ label, value, onChange, hint }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={hint}
        placeholderTextColor={T.mute}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="default"
      />
    </View>
  );
}
function Result({ rows }) {
  return (
    <View style={s.result}>
      {rows.map(([k, v]) => (
        <View key={k} style={s.row}>
          <Text style={s.rk}>{k}</Text>
          <Text style={s.rv}>{v}</Text>
        </View>
      ))}
    </View>
  );
}
const Note = ({ children }) => <Text style={s.note}>{children}</Text>;

// ---------- resistor colour bands ----------
const COL = [
  ['black', '#000000', 0, 1, null], ['brown', '#6B3E1F', 1, 10, 1], ['red', '#C62828', 2, 100, 2],
  ['orange', '#EF6C00', 3, 1e3, null], ['yellow', '#FBC02D', 4, 1e4, null], ['green', '#2E7D32', 5, 1e5, 0.5],
  ['blue', '#1565C0', 6, 1e6, 0.25], ['violet', '#7B1FA2', 7, 1e7, 0.1], ['grey', '#757575', 8, 1e8, 0.05],
  ['white', '#F5F5F5', 9, 1e9, null], ['gold', '#C9A227', null, 0.1, 5], ['silver', '#B0B0B0', null, 0.01, 10],
];
const byName = Object.fromEntries(COL.map((c) => [c[0], c]));

function BandRow({ title, options, value, onPick }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{title}: {value}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
        {options.map((c) => (
          <Pressable key={c[0]} onPress={() => onPick(c[0])}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c[1], borderWidth: value === c[0] ? 3 : 1, borderColor: value === c[0] ? T.brass : '#000' }} />
        ))}
      </View>
    </View>
  );
}
function ResistorCalc() {
  const [five, setFive] = useState(false);
  const [b, setB] = useState({ d1: 'brown', d2: 'black', d3: 'black', m: 'red', t: 'gold' });
  const set = (k) => (v) => setB({ ...b, [k]: v });
  const digits = COL.filter((c) => c[2] !== null);
  const tols = COL.filter((c) => c[4] !== null);
  const base = five ? byName[b.d1][2] * 100 + byName[b.d2][2] * 10 + byName[b.d3][2] : byName[b.d1][2] * 10 + byName[b.d2][2];
  const ohms = base * byName[b.m][3];
  const bands = five ? [b.d1, b.d2, b.d3, b.m, b.t] : [b.d1, b.d2, b.m, b.t];
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[false, true].map((f) => (
          <Pressable key={String(f)} onPress={() => setFive(f)} style={[s.chip, five === f && s.chipOn]}>
            <Text style={[s.chipT, five === f && s.chipTOn]}>{f ? '5 bands' : '4 bands'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.body}>
        {bands.map((n, i) => <View key={i} style={{ flex: 1, backgroundColor: byName[n][1] }} />)}
      </View>
      <BandRow title="Digit 1" options={digits} value={b.d1} onPick={set('d1')} />
      <BandRow title="Digit 2" options={digits} value={b.d2} onPick={set('d2')} />
      {five && <BandRow title="Digit 3" options={digits} value={b.d3} onPick={set('d3')} />}
      <BandRow title="Multiplier" options={COL} value={b.m} onPick={set('m')} />
      <BandRow title="Tolerance" options={tols} value={b.t} onPick={set('t')} />
      <Result rows={[['Resistance', fmt(ohms)], ['Tolerance', `±${byName[b.t][4]}%`],
        ['Range', `${fmt(ohms * (1 - byName[b.t][4] / 100))} – ${fmt(ohms * (1 + byName[b.t][4] / 100))}`]]} />
    </View>
  );
}

// ---------- capacitor code ----------
const TOL = { B: '±0.1 pF', C: '±0.25 pF', D: '±0.5 pF', F: '±1%', G: '±2%', J: '±5%', K: '±10%', M: '±20%', Z: '+80% / −20%' };
function CapCode() {
  const [v, setV] = useState('104K');
  const m = v.trim().toUpperCase().match(/^(\d{2,3})([A-Z])?$/);
  let rows = null;
  if (m) {
    const d = m[1];
    let pf = d.length === 2 ? parseInt(d, 10) : parseInt(d.slice(0, 2), 10) * (d[2] === '8' ? 0.01 : d[2] === '9' ? 0.1 : Math.pow(10, +d[2]));
    rows = [['Capacitance', fmt(pf * 1e-12, 'F')], ['In pF / nF / µF', `${+pf.toPrecision(5)} / ${+(pf / 1e3).toPrecision(5)} / ${+(pf / 1e6).toPrecision(5)}`]];
    if (m[2]) rows.push(['Tolerance', TOL[m[2]] || 'unknown letter']);
  }
  return (
    <View>
      <Field label="Code printed on the capacitor" value={v} onChange={setV} hint="e.g. 104, 473J, 22" />
      {rows ? <Result rows={rows} /> : <Note>Enter 2 or 3 digits, optionally followed by a tolerance letter.</Note>}
      <Note>Voltage markings (like 50V or 1H) are not decoded. Check the body of the part.</Note>
    </View>
  );
}

// ---------- LED resistor ----------
function LedCalc() {
  const [vs, setVs] = useState('9');
  const [vf, setVf] = useState('2');
  const [ma, setMa] = useState('20');
  const V = parseVal(vs), F = parseVal(vf), I = parseFloat(ma) / 1000;
  const ok = V > F && I > 0;
  const R = (V - F) / I;
  const Rs = ok ? nextE24(R) : NaN;
  const Ia = (V - F) / Rs;
  return (
    <View>
      <Field label="Supply voltage (V)" value={vs} onChange={setVs} hint="9" />
      <Field label="LED forward voltage (V)" value={vf} onChange={setVf} hint="red ≈ 2, white/blue ≈ 3" />
      <Field label="Wanted current (mA)" value={ma} onChange={setMa} hint="20" />
      {ok ? (
        <Result rows={[['Exact resistor', fmt(R)], ['Next standard (E24)', fmt(Rs)], ['Actual current', fmt(Ia, 'A')], ['Resistor power', fmt(Ia * Ia * Rs, 'W')]]} />
      ) : <Note>Supply voltage must be higher than the LED voltage.</Note>}
    </View>
  );
}

// ---------- voltage divider ----------
function Divider() {
  const [vin, setVin] = useState('9');
  const [r1, setR1] = useState('10k');
  const [r2, setR2] = useState('4.7k');
  const a = parseVal(vin), b = parseVal(r1), c = parseVal(r2);
  const ok = [a, b, c].every(isFinite);
  return (
    <View>
      <Field label="Input voltage (V)" value={vin} onChange={setVin} hint="9" />
      <Field label="R1, top (Ω)" value={r1} onChange={setR1} hint="10k" />
      <Field label="R2, bottom (Ω)" value={r2} onChange={setR2} hint="4.7k" />
      {ok ? <Result rows={[['Output voltage', fmt(a * c / (b + c), 'V')], ['Current drawn', fmt(a / (b + c), 'A')], ['Total power', fmt(a * a / (b + c), 'W')]]} /> : <Note>Enter numbers; k, M, m, u, n, p suffixes work.</Note>}
      <Note>Output is unloaded. A load on the output pulls it lower.</Note>
    </View>
  );
}

// ---------- Ohm's law ----------
function Ohm() {
  const [f, setF] = useState({ V: '', I: '', R: '', P: '' });
  const set = (k) => (t) => setF({ ...f, [k]: t });
  const x = {};
  ['V', 'I', 'R', 'P'].forEach((k) => { const n = parseVal(f[k]); if (isFinite(n)) x[k] = n; });
  const keys = Object.keys(x);
  let out = null;
  if (keys.length >= 2) {
    const [p, q] = keys.slice(0, 2).sort().join('');
    const pair = [p, q].join('');
    let { V, I, R, P } = x;
    if (pair === 'IV') { R = V / I; P = V * I; }
    else if (pair === 'RV') { I = V / R; P = V * V / R; }
    else if (pair === 'IR') { V = I * R; P = I * I * R; }
    else if (pair === 'PV') { I = P / V; R = V * V / P; }
    else if (pair === 'IP') { V = P / I; R = P / (I * I); }
    else if (pair === 'PR') { V = Math.sqrt(P * R); I = Math.sqrt(P / R); }
    out = [['Voltage', fmt(V, 'V')], ['Current', fmt(I, 'A')], ['Resistance', fmt(R)], ['Power', fmt(P, 'W')]];
  }
  return (
    <View>
      <Field label="Voltage (V)" value={f.V} onChange={set('V')} hint="optional" />
      <Field label="Current (A)" value={f.I} onChange={set('I')} hint="20m = 20 mA" />
      <Field label="Resistance (Ω)" value={f.R} onChange={set('R')} hint="4.7k" />
      <Field label="Power (W)" value={f.P} onChange={set('P')} hint="optional" />
      {out ? <Result rows={out} /> : <Note>Fill in any two values to get the other two.</Note>}
      {keys.length > 2 && <Note>More than two values entered. Only the first two are used.</Note>}
    </View>
  );
}

// ---------- RC time constant ----------
function RC() {
  const [r, setR] = useState('10k');
  const [c, setC] = useState('100u');
  const R = parseVal(r), C = parseVal(c);
  const ok = isFinite(R) && isFinite(C);
  const tau = R * C;
  return (
    <View>
      <Field label="Resistance (Ω)" value={r} onChange={setR} hint="10k" />
      <Field label="Capacitance (F)" value={c} onChange={setC} hint="100u = 100 µF" />
      {ok ? <Result rows={[['Time constant (τ)', fmt(tau, 's')], ['~63% charged after', fmt(tau, 's')], ['~99% charged after (5τ)', fmt(5 * tau, 's')], ['Cutoff frequency', fmt(1 / (2 * Math.PI * tau), 'Hz')]]} /> : <Note>Enter numbers; k, M, m, u, n, p suffixes work.</Note>}
    </View>
  );
}

// ---------- app shell ----------
const TOOLS = [
  ['My parts', Inventory], ['Resistor bands', ResistorCalc], ['Capacitor code', CapCode], ['LED resistor', LedCalc],
  ['Voltage divider', Divider], ["Ohm's law", Ohm], ['RC timing', RC],
];

export default function App() {
  const [i, setI] = useState(0);
  const Tool = TOOLS[i][1];
  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content" />
      <Text style={s.title}>Bench calculators</Text>
      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TOOLS.map(([name], k) => (
            <Pressable key={name} onPress={() => setI(k)} style={[s.chip, i === k && s.chipOn]}>
              <Text style={[s.chipT, i === k && s.chipTOn]}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Tool key={i} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  title: { color: T.ink, fontSize: 26, fontWeight: '700', padding: 16, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1, borderColor: T.line, justifyContent: 'center' },
  chipOn: { backgroundColor: T.brass, borderColor: T.brass },
  chipT: { color: T.ink, fontSize: 15 },
  chipTOn: { color: '#17211E', fontWeight: '700' },
  field: { marginBottom: 14 },
  label: { color: T.mute, fontSize: 14, marginBottom: 4 },
  input: { backgroundColor: T.card, color: T.ink, fontSize: 18, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: T.line },
  result: { backgroundColor: T.card, borderRadius: 12, padding: 14, marginTop: 6, borderLeftWidth: 4, borderLeftColor: T.brass },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 },
  rk: { color: T.mute, fontSize: 15, flexShrink: 1 },
  rv: { color: T.ink, fontSize: 17, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  note: { color: T.mute, fontSize: 14, marginTop: 12, lineHeight: 20 },
  body: { flexDirection: 'row', height: 36, borderRadius: 18, overflow: 'hidden', marginBottom: 16, backgroundColor: '#D8C9A3', borderWidth: 1, borderColor: '#000' },
});
