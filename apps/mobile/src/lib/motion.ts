import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { motion } from './theme';

/**
 * The system "reduce motion" setting, read once for the whole app and kept up to date: every card animates, so one
 * shared subscription instead of one question per card.
 */
let reduceMotion = false;
const listeners = new Set<() => void>();
let started = false;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!started) {
    started = true;
    const set = (on: boolean) => {
      if (on === reduceMotion) return;
      reduceMotion = on;
      listeners.forEach((l) => l());
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(set);
    AccessibilityInfo.addEventListener('reduceMotionChanged', set);
  }
  return () => listeners.delete(listener);
}

export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, () => reduceMotion);
}

/** Ease-out of the Amanecer motion spec: quick start, soft landing. */
const easeOut = Easing.bezier(0.2, 0.9, 0.25, 1);

/**
 * A value that animates to `target` over `duration` ms (React Native's own Animated: no native module, and tests
 * see the same tree); with the system "reduce motion" it jumps there at once. `native` for opacity and transforms.
 */
export function useAnimatedTo(
  target: number,
  duration: number,
  { from = 0, native = true }: { from?: number; native?: boolean } = {},
): Animated.Value {
  const reduce = useReduceMotion();
  const [value] = useState(() => new Animated.Value(from));
  useEffect(() => {
    if (reduce) {
      value.setValue(target);
      return;
    }
    const animation = Animated.timing(value, {
      toValue: target,
      duration,
      easing: easeOut,
      useNativeDriver: native,
    });
    animation.start();
    return () => animation.stop();
  }, [reduce, target, duration, native, value]);
  return value;
}

/** Card entrance: 0 → 1 over 420 ms (rise 8 px and fade in), or 1 at once with reduce motion. */
export function useRise(): Animated.Value {
  return useAnimatedTo(1, motion.rise);
}
