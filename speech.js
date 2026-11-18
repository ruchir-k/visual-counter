export function speak(text, enabled) {
  if (!enabled || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(String(text));
  utt.rate  = 1.1;
  utt.pitch = 1.0;
  speechSynthesis.speak(utt);
}
