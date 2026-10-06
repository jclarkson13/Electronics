import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const T = { bg: '#17211E', card: '#223029', ink: '#E9EBDD', mute: '#8FA39A', brass: '#D9A441', line: '#2F4239' };
const TYPES = ['Resistor', 'Capacitor', 'LED', 'Diode', 'Transistor', 'IC', 'Other'];
const KEY = 'parts-v1';
const LOW = 2; // quantities at or below this are flagged

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [type, setType] = useState('Resistor');
  const [value, setValue] = useState('');
  const [qty, setQty] = useState('1');
  const [loc, setLoc] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((r) => { if (r) setItems(JSON.parse(r)); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  }, [items, ready]);

  const add = () => {
    const n = parseInt(qty, 10);
    const v = value.trim();
    if (!v || !(n >= 0)) return;
    const l = loc.trim();
    const same = (i) => i.type === type && i.value.toLowerCase() === v.toLowerCase() && i.loc.toLowerCase() === l.toLowerCase();
    if (items.some(same)) setItems(items.map((i) => (same(i) ? { ...i, qty: i.qty + n } : i)));
    else setItems([{ id: String(Date.now()), type, value: v, qty: n, loc: l }, ...items]);
    setValue('');
    setQty('1');
  };
  const bump = (id, d) => setItems(items.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i)));
  const remove = (i) =>
    Alert.alert('Remove part?', `${i.value} ${i.type}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems(items.filter((x) => x.id !== i.id)) },
    ]);

  const terms = q.toLowerCase().split(' ').filter(Boolean);
  const shown = items.filter((i) => {
    const text = `${i.type} ${i.value} ${i.loc}`.toLowerCase();
    return terms.every((t) => text.includes(t));
  });
  const total = items.reduce((a, i) => a + i.qty, 0);

  return (
    <View>
      <Text style={s.label}>Part type</Text>
      <View style={s.wrap}>
        {TYPES.map((t) => (
          <Pressable key={t} onPress={() => setType(t)} style={[s.chip, type === t && s.chipOn]}>
            <Text style={[s.chipT, type === t && s.chipTOn]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.label}>Value or part number</Text>
      <TextInput style={s.input} value={value} onChangeText={setValue} placeholder="10k, 100nF, 2N3904" placeholderTextColor={T.mute} autoCapitalize="none" autoCorrect={false} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ width: 90 }}>
          <Text style={s.label}>Quantity</Text>
          <TextInput style={s.input} value={qty} onChangeText={setQty} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Storage location</Text>
          <TextInput style={s.input} value={loc} onChangeText={setLoc} placeholder="drawer 2, blue box" placeholderTextColor={T.mute} />
        </View>
      </View>
      <Pressable onPress={add} style={s.add}>
        <Text style={s.addT}>Add part</Text>
      </Pressable>

      <Text style={[s.label, { marginTop: 24 }]}>{items.length} kinds, {total} parts in total</Text>
      <TextInput style={s.input} value={q} onChangeText={setQ} placeholder="Search: 10k, drawer 2, capacitor" placeholderTextColor={T.mute} autoCapitalize="none" autoCorrect={false} />

      {shown.length === 0 && (
        <Text style={s.note}>{items.length === 0 ? 'No parts yet. Add your first one above.' : 'Nothing matches that search.'}</Text>
      )}
      {shown.map((i) => (
        <View key={i.id} style={s.card}>
          <View style={{ flex: 1 }}>
            <Text style={s.val}>{i.value}</Text>
            <Text style={s.sub}>{i.type}{i.loc ? `  •  ${i.loc}` : ''}</Text>
            {i.qty <= LOW && <Text style={s.low}>{i.qty === 0 ? 'Out of stock' : 'Running low'}</Text>}
            <Pressable onPress={() => remove(i)} hitSlop={8}><Text style={s.rm}>Remove</Text></Pressable>
          </View>
          <View style={s.stepper}>
            <Pressable onPress={() => bump(i.id, -1)} style={s.btn}><Text style={s.btnT}>−</Text></Pressable>
            <Text style={s.qty}>{i.qty}</Text>
            <Pressable onPress={() => bump(i.id, 1)} style={s.btn}><Text style={s.btnT}>+</Text></Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  label: { color: T.mute, fontSize: 14, marginBottom: 4, marginTop: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1, borderColor: T.line, justifyContent: 'center' },
  chipOn: { backgroundColor: T.brass, borderColor: T.brass },
  chipT: { color: T.ink, fontSize: 14 },
  chipTOn: { color: '#17211E', fontWeight: '700' },
  input: { backgroundColor: T.card, color: T.ink, fontSize: 17, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: T.line },
  add: { backgroundColor: T.brass, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  addT: { color: '#17211E', fontSize: 17, fontWeight: '700' },
  note: { color: T.mute, fontSize: 14, marginTop: 14, lineHeight: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: 12, padding: 14, marginTop: 10, borderLeftWidth: 4, borderLeftColor: T.line },
  val: { color: T.ink, fontSize: 19, fontWeight: '700' },
  sub: { color: T.mute, fontSize: 14, marginTop: 2 },
  low: { color: T.brass, fontSize: 13, fontWeight: '700', marginTop: 4 },
  rm: { color: T.mute, fontSize: 13, marginTop: 8, textDecorationLine: 'underline' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: T.line, alignItems: 'center', justifyContent: 'center' },
  btnT: { color: T.ink, fontSize: 22, lineHeight: 24 },
  qty: { color: T.ink, fontSize: 20, fontWeight: '700', minWidth: 34, textAlign: 'center' },
});
