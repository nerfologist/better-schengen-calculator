# Official EU Schengen calculator (test oracle)

Unmodified snapshot of the official EU short-stay calculator, used only as a
reference implementation ("oracle") in the test suite: `test/eu-oracle.test.ts`
loads this page in jsdom, drives its form, and asserts that our domain logic
produces the same allowed-stay results.

- Source: https://ec.europa.eu/assets/home/visa-calculator/calculator.htm?lang=en
  (plus its two script dependencies, `jquery.js` and `purl.js`)
- Retrieved: 2026-09-07
- © European Union. Reused for interoperability testing under the Commission's
  document-reuse policy (Decision 2011/833/EU).

Do not edit these files; refresh them from the source URL instead.
