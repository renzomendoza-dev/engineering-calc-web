/**
 * Typographic tidy-up for text the API authored — error messages, warnings, reference-data notes.
 *
 * calc-core writes its messages with an ASCII double hyphen ("no duct size satisfies these inputs
 * -- try adjusting the target friction rate"), which renders as a stray "--" next to this app's
 * own em dashes. Substituting the dash is presentation only: it changes no wording, no numbers and
 * no meaning, and it is the only change made to server text anywhere in the UI.
 *
 * Deliberately narrow — only a double hyphen with a space on each side, which is unambiguously a
 * dash. An unspaced "--" is left alone, so something like a "--flag" in a message survives intact.
 *
 * Fixing the messages in calc-core would make this unnecessary; until then it's one call rather
 * than a stray dash on every calculator.
 */
export function formatApiText(text: string): string {
  return text.replace(/ -- /g, " — ");
}
