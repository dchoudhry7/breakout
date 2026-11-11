import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fmtWait, Gate } from '../lib/friction';
import { showRewardedAd } from '../lib/ads';
import { success, tap } from '../lib/haptics';
import { useStore } from '../lib/store';
import { c, f } from '../theme';
import { Icon } from './Icons';

type Request = { title: string; action: string; onGranted: () => void };
type GateApi = {
  /**
   * Make the user earn turning blocking off. Starting a block never goes through here.
   * `onGranted` runs only after the wait is over (or an ad was watched).
   */
  confirm: (title: string, action: string, onGranted: () => void) => void;
};

const Ctx = createContext<GateApi | null>(null);

export function useGate() {
  const g = useContext(Ctx);
  if (!g) throw new Error('useGate must be used inside GateProvider');
  return g;
}

export function GateProvider({ children }: { children: React.ReactNode }) {
  const { openGate, clearGate } = useStore();
  const [req, setReq] = useState<Request | null>(null);
  const [gate, setGate] = useState<Gate | null>(null);

  // The context value never changes, so screens using it don't re-render; it calls the latest openGate.
  const confirmRef = useRef<GateApi['confirm']>(() => {});
  useEffect(() => {
    confirmRef.current = (title, action, onGranted) => {
      setGate(openGate());
      setReq({ title, action, onGranted });
    };
  }, [openGate]);
  const value = useMemo<GateApi>(() => ({ confirm: (t, a, g) => confirmRef.current(t, a, g) }), []);

  const close = () => setReq(null);
  const grant = () => {
    const done = req?.onGranted;
    clearGate();
    setReq(null);
    done?.();
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {req && gate ? <GateModal req={req} gate={gate} onCancel={close} onGrant={grant} /> : null}
    </Ctx.Provider>
  );
}

function GateModal({ req, gate, onCancel, onGrant }: { req: Request; gate: Gate; onCancel: () => void; onGrant: () => void }) {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => Date.now());
  const [adBusy, setAdBusy] = useState(false);
  const granted = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const leftMs = Math.max(0, gate.readyAt - now);
  const ready = leftMs <= 0;
  const progress = gate.waitSec ? 1 - leftMs / (gate.waitSec * 1000) : 1;

  const finish = () => {
    if (granted.current) return;
    granted.current = true;
    success();
    onGrant();
  };

  const watchAd = async () => {
    if (adBusy) return;
    tap();
    setAdBusy(true);
    const earned = await showRewardedAd();
    setAdBusy(false);
    if (earned) finish();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[s.backdrop, { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
        <View style={s.sheet}>
          <View style={s.badge}>
            <Icon name="lock" size={14} color={c.accent} width={2.4} />
            <Text style={s.badgeText}>Unblock attempt #{gate.count} today</Text>
          </View>

          <Text style={s.title}>{req.title}</Text>
          <Text style={s.body}>
            Turning blocking off costs time, and each attempt today costs more than the last. Starting a block is always instant.
          </Text>

          <View style={s.timerBox}>
            <Text style={s.timer}>{ready ? 'Ready' : fmtWait(Math.ceil(leftMs / 1000))}</Text>
            <View style={s.track}>
              <View style={[s.fill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={s.small}>
              {ready ? 'The wait is over. Still want to do it?' : `Wait ${fmtWait(gate.waitSec)} or watch a short ad to skip it.`}
            </Text>
          </View>

          <Pressable accessibilityRole="button" onPress={onCancel} style={s.keep}>
            <Text style={s.keepText}>Keep blocking</Text>
          </Pressable>

          {ready ? (
            <Pressable accessibilityRole="button" onPress={finish} style={s.go}>
              <Text style={s.goText}>{req.action}</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" disabled={adBusy} onPress={watchAd} style={[s.go, adBusy && { opacity: 0.6 }]}>
              <Text style={s.goText}>{adBusy ? 'Playing ad…' : `Watch an ad to ${req.action.toLowerCase()} now`}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'center', paddingHorizontal: 20 },
  sheet: { backgroundColor: c.card, borderRadius: 28, borderWidth: 1, borderColor: c.border, padding: 22, gap: 14 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: c.selected },
  badgeText: { fontFamily: f.b600, fontSize: 12, color: c.accent },
  title: { fontFamily: f.h700, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: c.text },
  body: { fontFamily: f.b400, fontSize: 14, lineHeight: 20, color: c.soft },
  timerBox: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  timer: { fontFamily: f.h700, fontSize: 52, lineHeight: 56, letterSpacing: -1.5, color: c.text },
  track: { alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: c.track, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: c.accent },
  small: { fontFamily: f.b400, fontSize: 13, color: c.muted, textAlign: 'center' },
  keep: { height: 54, borderRadius: 27, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  keepText: { fontFamily: f.b600, fontSize: 16, color: c.onAccent },
  go: { height: 50, borderRadius: 25, borderWidth: 1, borderColor: c.border, backgroundColor: c.chip, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  goText: { fontFamily: f.b500, fontSize: 14, color: c.danger },
});
