import assert from "node:assert/strict";
import { mock, suite, test } from "node:test";

import markdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";

import markdownItMathspan from "../index.js";

/**
 * @param {string} str
 * @returns {string}
 */
function mathspan(str) {
  return `<span class="math inline">${str}</span>`;
}

/**
 * @param {string} str
 * @returns {string}
 */
function p(str) {
  return `<p>${str}</p>\n`;
}

suite("Options", () => {
  suite("minDelims", () => {
    test("Rejects if fewer delims", () => {
      const md = markdownIt().use(markdownItMathspan, { minDelims: 2 });
      const src = "$foo$";
      const res = md.render(src);

      assert.equal(res, p("$foo$"));
    });

    test("Accepts equal delims", () => {
      const md = markdownIt().use(markdownItMathspan, { minDelims: 2 });
      const src = "$$foo$$";
      const res = md.render(src);

      assert.equal(res, p(mathspan("foo")));
    });
  });

  suite("renderer", () => {
    test("Custom renderer", () => {
      const md = markdownIt().use(markdownItMathspan, {
        renderer: (src) => `<NULL>${src}</NULL>`,
      });

      const src = "$foo$";
      const res = md.render(src);

      assert.equal(res, p("<NULL>foo</NULL>"));
    });

    test("Correct arguments passed into renderer", () => {
      const renderer = mock.fn((_src, _token, _md) => "");
      const md = markdownIt().use(markdownItMathspan, { renderer });

      md.render("$foo$");

      const [firstCall] = renderer.mock.calls;
      assert.ok(firstCall);

      const args = firstCall.arguments;

      assert.equal(args[0], "foo");
      assert.equal(args[1] instanceof Token, true);
      assert.equal(args[2], md);
    });

    test("customElement", () => {
      const md = markdownIt().use(markdownItMathspan, {
        customElement: "my-el",
      });

      const src = "$foo$";
      const res = md.render(src);

      assert.equal(res, p("<my-el>foo</my-el>"));
    });

    test("customElement no-attrs", () => {
      const md = markdownIt().use(markdownItMathspan, {
        customElement: ["my-el"],
      });

      const src = "$foo$";
      const res = md.render(src);

      assert.equal(res, p("<my-el>foo</my-el>"));
    });

    test("customElement attrs", () => {
      const md = markdownIt().use(markdownItMathspan, {
        customElement: ["my-el", { class: "bar" }],
      });

      const src = "$foo$";
      const res = md.render(src);

      assert.equal(res, p('<my-el class="bar">foo</my-el>'));
    });

    test("Default renderer from <math-up> customElement registry", (t) => {
      const restoreCustomElements = globalThis.customElements;
      t.before(() => {
        globalThis.customElements = {
          // @ts-ignore
          get(name) {
            if (name === "math-up") {
              return {};
            }

            return undefined;
          },
        };
      });
      t.after(() => {
        globalThis.customElements = restoreCustomElements;
      });

      const md = markdownIt().use(markdownItMathspan);
      const src = "$foo$";
      const res = md.render(src);

      assert.equal(res, p("<math-up>foo</math-up>"));
    });

    test("Default renderer from <la-tex> customElement registry", (t) => {
      const restoreCustomElements = globalThis.customElements;
      t.before(() => {
        globalThis.customElements = {
          // @ts-ignore
          get(name) {
            if (name === "la-tex") {
              return {};
            }

            return undefined;
          },
        };
      });
      t.after(() => {
        globalThis.customElements = restoreCustomElements;
      });

      const md = markdownIt().use(markdownItMathspan);
      const src = "$foo$";
      const res = md.render(src);

      assert.equal(res, p("<la-tex>foo</la-tex>"));
    });
  });
});

suite("Commonmark", () => {
  // https://spec.commonmark.org/0.31.2/#code-spans
  const md = markdownIt().use(markdownItMathspan);

  test("Example 14", () => {
    const src = "\\$not math$";
    const res = md.render(src);

    assert.equal(res, p("$not math$"));
  });

  test("Example 328", () => {
    const src = "$foo$";
    const res = md.render(src);

    assert.equal(res, p(mathspan("foo")));
  });

  test("Example 329", () => {
    const src = "$$ foo $ bar $$";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan("foo $ bar")}`));
  });

  test("Example 330", () => {
    const src = "$ $$ $";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan("$$")}`));
  });

  test("Example 331", () => {
    const src = "$  $$  $";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan(" $$ ")}`));
  });

  test("Example 332", () => {
    const src = "$ a$";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan(" a")}`));
  });

  test("Example 333", () => {
    const src = "$ b $";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan(" b ")}`));
  });

  test("Example 334", () => {
    const src = "$ $\n$  $";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan(" ")}\n${mathspan("  ")}`));
  });

  test("Example 335", () => {
    const src = `$$
foo
bar  
baz
$$`;
    const res = md.render(src);

    assert.equal(res, p(`${mathspan("foo bar   baz")}`));
  });

  test("Example 336", () => {
    const src = `$$
foo 
$$
`;
    const res = md.render(src);

    assert.equal(res, p(`${mathspan("foo ")}`));
  });

  test("Example 337", () => {
    const src = `$foo   bar 
baz$`;
    const res = md.render(src);

    assert.equal(res, p(`${mathspan("foo   bar  baz")}`));
  });

  test("Example 338", () => {
    const src = "$foo\\$bar$";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan("foo\\")}bar$`));
  });

  test("Example 339", () => {
    const src = "$$foo$bar$$";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan("foo$bar")}`));
  });

  test("Example 340", () => {
    const src = "$ foo $$ bar $";
    const res = md.render(src);

    assert.equal(res, p(`${mathspan("foo $$ bar")}`));
  });

  test("Example 341", () => {
    const src = "*foo$*$";
    const res = md.render(src);

    assert.equal(res, p(`*foo${mathspan("*")}`));
  });

  test("Example 342", () => {
    const src = "[not a $link](/foo$)";
    const res = md.render(src);

    assert.equal(res, p(`[not a ${mathspan("link](/foo")})`));
  });

  test("Example 343", () => {
    const src = "$`foo$bar`$";
    const res = md.render(src);

    const fooCode = "`foo";
    assert.equal(res, p(`${mathspan(fooCode)}bar\`$`));
  });

  test("Example 344", () => {
    const src = "`$foo`bar$`";
    const res = md.render(src);

    assert.equal(res, p(`<code>$foo</code>bar$\``));
  });

  test("Example 347", () => {
    const src = "$$$foo$$";
    const res = md.render(src);

    assert.equal(res, p(`$$$foo$$`));
  });

  test("Example 348", () => {
    const src = "$foo";
    const res = md.render(src);

    assert.equal(res, p(`$foo`));
  });

  test("Example 349", () => {
    const src = "$foo$$bar$$";
    const res = md.render(src);

    assert.equal(res, p(`$foo${mathspan("bar")}`));
  });
});
