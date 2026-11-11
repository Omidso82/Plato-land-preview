import {
  extractAtSignCandidates,
  uniqueExactAtSignCandidates,
} from "../../../src/plato-id-scanner-extraction.ts";

const assertEquals = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
  }
};

Deno.test("extracts one ID per line", () => {
  const result = extractAtSignCandidates("@PlayerOne\n@PlayerTwo\n@PlayerThree");
  assertEquals(result.map((item) => item.raw_value), ["@PlayerOne", "@PlayerTwo", "@PlayerThree"]);
});

Deno.test("extracts multiple IDs on one line separated by spaces", () => {
  const result = extractAtSignCandidates("@PlayerOne @PlayerTwo @PlayerThree");
  assertEquals(result.map((item) => item.raw_value), ["@PlayerOne", "@PlayerTwo", "@PlayerThree"]);
});

Deno.test("splits directly concatenated IDs at the next @", () => {
  const result = extractAtSignCandidates("@PlayerOne@PlayerTwo@PlayerThree");
  assertEquals(result.map((item) => item.raw_value), ["@PlayerOne", "@PlayerTwo", "@PlayerThree"]);
});

Deno.test("handles mixed spaces, line breaks, and concatenated IDs", () => {
  const result = extractAtSignCandidates("Title @One@Two\nplain text @Three @Four@Five");
  assertEquals(result.map((item) => item.raw_value), ["@One", "@Two", "@Three", "@Four", "@Five"]);
});

Deno.test("ignores text before an @ marker", () => {
  const result = extractAtSignCandidates("DisplayName ordinary_text\n@Real_ID");
  assertEquals(result.map((item) => item.raw_value), ["@Real_ID"]);
});

Deno.test("preserves exact spelling, case and underscores", () => {
  const result = extractAtSignCandidates("@User_1@user_1@User_1");
  assertEquals(result.map((item) => item.raw_value), ["@User_1", "@user_1", "@User_1"]);
});

Deno.test("exact duplicates only are removed; similar candidates remain separate", () => {
  const result = uniqueExactAtSignCandidates(extractAtSignCandidates("@Same@Same@Sarne@same"));
  assertEquals(result.map((item) => item.raw_value), ["@Same", "@Sarne", "@same"]);
});

Deno.test("candidate positions point to the original OCR text", () => {
  const text = "first line\n  @Exact_ID@Next";
  const item = extractAtSignCandidates(text)[0];
  assertEquals(text.slice(item.start, item.end), "@Exact_ID");
});

Deno.test("no at-sign means no candidate", () => {
  assertEquals(extractAtSignCandidates("PlainID another_word"), []);
});
