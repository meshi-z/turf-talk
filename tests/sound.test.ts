import test from 'node:test';
import assert from 'node:assert/strict';
import { soundManager } from '../src/lib/sound.ts';

test('soundManager: toggling enable state', () => {
  const initial = soundManager.isEnabled();
  
  soundManager.setEnabled(!initial);
  assert.equal(soundManager.isEnabled(), !initial);

  soundManager.setEnabled(initial);
  assert.equal(soundManager.isEnabled(), initial);
});

test('soundManager: safe method invocation in Node environment without crashing', () => {
  // Node環境下（windowやAudioContextが存在しない環境）でも例外をスローせず安全に終了すること
  assert.doesNotThrow(() => {
    soundManager.playCorrect();
  });

  assert.doesNotThrow(() => {
    soundManager.playIncorrect();
  });

  assert.doesNotThrow(() => {
    soundManager.playStamp();
  });

  assert.doesNotThrow(() => {
    soundManager.playFanfare();
  });

  assert.doesNotThrow(() => {
    soundManager.playGateOpen();
  });

  assert.doesNotThrow(() => {
    soundManager.playHint();
  });
});
