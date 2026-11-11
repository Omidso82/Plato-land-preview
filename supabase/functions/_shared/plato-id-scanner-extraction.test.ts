import {
  extractAtSignCandidates,
  uniqueExactAtSignCandidates,
} from "../../../src/plato-id-scanner-extraction.ts";

const assertEquals = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
  }
};

Deno.test("only whitespace-delimited tokens beginning with @ are candidates", () => {
  const result = extractAtSignCandidates("Name text\n@Plato_123 other words\nplainID @SecondID");
  assertEquals(result.map((item) => item.raw_value), ["@Plato_123", "@SecondID"]);
});

Deno.test("raw spelling, case, underscores and punctuation are preserved", () => {
  const result = extractAtSignCandidates("@User_1 @user_1 @User_1,");
  assertEquals(result.map((item) => item.raw_value), ["@User_1", "@user_1", "@User_1,"]);
});

Deno.test("exact duplicates only are removed; similar candidates remain separate", () => {
  const result = uniqueExactAtSignCandidates(extractAtSignCandidates("@Same @Same @Sarne @same"));
  assertEquals(result.map((item) => item.raw_value), ["@Same", "@Sarne", "@same"]);
});

Deno.test("candidate positions point to the original OCR text", () => {
  const text = "first\n  @Exact_ID second";
  const item = extractAtSignCandidates(text)[0];
  assertEquals(text.slice(item.start, item.end), "@Exact_ID");
});

Deno.test("no at-sign means no candidate", () => {
  assertEquals(extractAtSignCandidates("PlainID another_word"), []);
});
