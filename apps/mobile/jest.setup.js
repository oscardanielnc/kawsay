/* global jest, require */
/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories cannot use import */
/**
 * Motion in tests lands at once, as with the system "reduce motion": expo-router's renderRouter runs on fake
 * timers, and running animations would eat the time a findBy waits for SQLite.
 */
jest.mock('./src/lib/motion', () => {
  const { useState } = require('react');
  const { Animated } = require('react-native');
  const useAnimatedTo = (target) => {
    const [value] = useState(() => new Animated.Value(target));
    value.setValue(target);
    return value;
  };
  return {
    ...jest.requireActual('./src/lib/motion'),
    useAnimatedTo,
    useRise: () => useAnimatedTo(1),
  };
});
