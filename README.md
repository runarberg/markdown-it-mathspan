# markdown-it-mathspan

[![ci](https://github.com/runarberg/markdown-it-mathspan/actions/workflows/ci.yml/badge.svg)](https://github.com/runarberg/markdown-it-mathspan/actions/workflows/ci.yml)
![Coverage](https://runarberg.github.io/markdown-it-mathspan/badge.svg)
[![npm](https://img.shields.io/npm/v/markdown-it-mathspan.svg)](https://www.npmjs.com/package/markdown-it-mathspan)
[![License](https://img.shields.io/npm/l/markdown-it-mathspan)](https://github.com/runarberg/markdown-it-mathspan/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/markdown-it-mathspan)](https://npm-stat.com/charts.html?package=markdown-it-mathspan)

> A markdown-it plugin to render inline math that feels like markdown.

This is a markdown-it plugin which renders inline math (delimited by
`$`) with the same behavior as [backticks][commonmark#code-spans] (`` ` ``)
according to the commonmark spec.

This is useful if you are more familiar with markdown than LaTeX and
sometimes need to include dollar signs in your math expressions.

```md
- Function application: $$f$0 = 1$$.
- Calculating dollars: $$ $a + $b = $c $$.
- Double dollars: $ 1 + $$ + 2 $.
- This is \$42: $$ $5 + $37 $$.
```

## Install

```bash
npm install --save markdown-it markdown-it-mathspan
```

**Note**: This plugin does not include a math renderer. So you must
provide your own: Here are some excellent choices:

- [mathup][mathup] (an AsciiMath Dialect):
  ```bash
  npm install --save mathup
  ```
- [Temml][temml] (LaTeX):
  ```bash
  npm install --save temml
  # And if you plan on using the <la-tex> custom elements (see usage)
  npm install --save temml-custom-element
  ```

## Usage

### Mathup (AsciiMath dialect)

See [mathup][mathup] for the renderer reference.

```js
import markdownIt from "markdown-it";
import markdownItMathspan from "markdown-it-mathspan";

// Optional (for default mathup renderer)
import "mathup/custom-element";

// Optional, with defaults
const options = {
  minDelims: 1,
  renderer, // See below
  customElement, // See below
};

const md = markdownIt().use(markdownItMathspan, options);

md.render(`
# Document

With inline math $a^2 + b^2 = c^2$.
`);
// <h1>Document</h1>
// <p>
//   With inline math <math-up>a^2 + b^2 = c^2</math-up>.
// </p>
```

### LaTeX

See [Temml][temml] for the renderer reference and
[temml-custom-element][temml-custom-element] for reference on the
`<la-tex>` custom element.

```js
import markdownIt from "markdown-it";
import markdownItMathspan from "markdown-it-mathspan";

// import the <la-tex> element. When registered, we default to that.
import "temml-custom-element";

md.render(`
# Document

With inline math $e^{i\theta} = \cos\theta + i\sin\theta$.
`);
// <h1>Document</h1>
// <p>
//   With inline math <la-tex>e^{i\theta} = \cos\theta + i\sin\theta</la-tex>.
// </p>
```

### Options

- **`minDelims`**: The minimum required number of delimiters around a
  math block. You may want to set this to 2 if you are afraid that
  dollar amounts will accidentally parse as math:
  ```md
  Price of apples $1-$2. Price of bananas around $10?
  ```
- **`renderer`**: The math renderer. Accepts the source, the parsed
  `MarkdownIt` token, and the `markdownIt` instance. Defaults to a
  function that surrounds and escapes with a custom element (see below).
  ```js
  {
    renderer: (src, token, md) =>
      `<math-up>${md.utils.escapeHtml(src)}</math-up>`,
  }
  ```
- **`customElement`**: If you want to specify which custom element to
  render into, this is a convenience option to do so. Accepts a pair of
  `["tag-name", { attribute: "value" }]` The default is:
  ```js
  {
    customElement: ["math-up"],
  }
  ```

### Default renderer

The default renderer depends on which custom element depends on which
elements are in in your [custom elment-registry][custom-element-registry].
It will try the following in order:

1. `<math-up>` ([see mathup][mathup])
2. `<la-tex>` ([see temml][temml] and [temml-custom-element][temml-custom-element])
3. If none is found it will default to `<span class="math inline">`

## Examples

Use with [markdown-it-mathblock][markdown-it-mathblock]:

```js
import markdownIt from "markdown-it";
import markdownItMathblock from "markdown-it-mathblock";
import markdownItMathspan from "markdown-it-mathspan";
import "mathup/custom-element";

const md = markdownIt().use(markdownItMathblock).use(markdownItMathspan);

md.render(`
Inline math $a^2 + b^2 = c^2$. And block math:

$$
x = -b+-sqrt(b^2 - 4ac) / 2a
$$
`);
// <p>Inline math <math-up>a^2 + b^2 = c^2</math-up>. And block math:</p>
// <math-up display="block">x = -b+-sqrt(b^2 - 4ac) / 2a</math-up>
```

Enforce thicker delimiters:

```js
import markdownIt from "markdown-it";
import markdownItMathblock from "markdown-it-mathblock";
import "mathup/custom-element";

const md = markdownIt().use(markdownItMath, { minDelims: 2 });

md.render(`
$This is not math$

$$[b, u, t] * t[h, i, s] = i_s$$
`);
```

Render the expression straight into MathML using [mathup][mathup]. You
might want to include the stylesheet from mathup for this.

```js
import markdownIt from "markdown-it";
import markdownItmathspan from "markdown-it-mathspan";
import mathup from "mathup";

const md = markdownIt().use(markdownItMathspan, {
  renderer: (src) => mathup(src).toString(),
});

md.render(`
$pi ~~ 3.14159$.
`);
// <p><math><mi>π</mi><mo>≈</mo><mn>3.14159</mn></math>.</p>
```

Render the expression from LaTeX into MathML using [Temml][temml]. You
might want to include the stylesheet and fonts from Temml for this.

```js
import markdownIt from "markdown-it";
import markdownItMathspan from "markdown-it-mathspan";
import temml from "temml";

const md = markdownIt().use(markdownItMathblock, {
  renderer: (src) => temml.renderToString(src),
});

md.render(`
$\sin x$.
`);
// <p><math><!- ... --></math>.</p>
```

Pass in custom attributes to the renderer `<math-up>` element:

```js
import markdownIt from "markdown-it";
import markdownItMathspan from "markdown-it-mathspan";
import "mathup/custom-element";

const md = markdownIt().use(markdownItMathspan, {
  customElement: ["math-up", { "decimal-mark": "," }],
});

md.render(`
$pi ~~ 3,14159$.
`);
// <p><math-up decimal-mark=",">pi ~~ 3,14159</math-up>.</p>
```

## See Also and References

- [markdown-it-math][markdown-it-math] - For a more LaTeX like plugin.
- [markdown-it-mathblock][markdown-it-mathblock] - If you also want to include block math.
- [mathup][mathup] - An AsciiMath dialect renderer.
- [Temml][temml] - A LaTeX math renderer.
- [temml-custom-element][temml-custom-element] - A custom element wrapper arround temml.
- [Commonmark spec for code spans][commonmark#code-spans]

[commonmark#code-spans]: https://spec.commonmark.org/0.31.2/#code-spans
[custom-element-registry]: https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry
[markdown-it-math]: https://github.com/runarberg/math
[markdown-it-mathblock]: https://github.com/runarberg/mathblock
[mathup]: https://mathup.xyz/
[temml]: https://temml.org/
[temml-custom-element]: https://github.com/runarberg/temml-custom-element
