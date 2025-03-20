// https://github.com/markdown-it/markdown-it/blob/master/lib/rules_inline/backticks.mjs

/**
 * @typedef {import("markdown-it").default} MarkdownIt
 * @typedef {import("markdown-it/lib/parser_inline.mjs").RuleInline} RuleInline
 * @typedef {import("markdown-it/lib/rules_inline/state_inline.mjs").default} StateInline
 * @typedef {import("markdown-it/lib/token.mjs").default} Token
 */

/**
 * @typedef {object} DollarStateCache
 * @property {Record<number, number>} [dollars]
 * @param {object} options
 * @param {number} options.minDelims
 * @returns {RuleInline}
 */
function createRuler({ minDelims }) {
  return (state, silent) => {
    let { pos } = state;
    const ch = state.src.at(pos);

    if (ch !== "$") {
      return false;
    }

    const start = pos;
    const max = state.posMax;

    pos += 1;

    // scan marker length
    while (pos < max && state.src.at(pos) === "$") {
      pos += 1;
    }

    const marker = state.src.slice(start, pos);
    const openerLength = marker.length;

    if (openerLength < minDelims) {
      return false;
    }

    /** @type {{ cache: DollarStateCache }} */
    const { cache } = state;

    if (cache.dollars && (cache.dollars[openerLength] ?? 0) <= start) {
      if (!silent) {
        state.pending += marker;
      }

      state.pos += openerLength;

      return true;
    }

    // Nothing found in the cache, scan until the end of the line (or until marker is found)

    let matchEnd = pos;
    let matchStart = state.src.indexOf("$", matchEnd);
    while (matchStart !== -1) {
      matchEnd = matchStart + 1;

      // scan marker length
      while (matchEnd < max && state.src.at(matchEnd) === "$") {
        matchEnd += 1;
      }

      const closerLength = matchEnd - matchStart;

      if (closerLength === openerLength) {
        // Found matching closer length.
        if (!silent) {
          const token = state.push("mathspan", "math", 0);
          token.markup = marker;
          token.content = state.src
            .slice(pos, matchStart)
            .replaceAll("\n", " ")
            .replace(/^ (.+) $/, "$1");
        }
        state.pos = matchEnd;
        return true;
      }

      // Some different length found, put it in cache as upper limit of where closer can be found
      if (cache.dollars) {
        cache.dollars[closerLength] = matchStart;
      } else {
        cache.dollars = { [closerLength]: matchStart };
      }

      matchStart = state.src.indexOf("$", matchEnd);
    }

    // Scanned through the end, didn't find anything
    if (!cache.dollars) {
      cache.dollars = {};
    }

    if (!silent) {
      state.pending += marker;
    }

    state.pos += openerLength;

    return true;
  };
}

/**
 * @typedef {string | [tag: string, attrs?: Record<string, string>]} CustomElementOption
 */

/**
 * @param {CustomElementOption} customElementOption
 * @param {MarkdownIt} md
 * @returns {(src: string) => string}
 */
function createCustomElementRenderer(customElementOption, md) {
  const { escapeHtml } = md.utils;

  /** @type {string} */
  let tag;
  /** @type {string} */
  let attrs = "";
  if (typeof customElementOption === "string") {
    tag = customElementOption;
  } else {
    const [tagName, attrsObj = {}] = customElementOption;
    tag = tagName;
    for (const [key, value] of Object.entries(attrsObj)) {
      attrs += ` ${key}="${escapeHtml(value)}"`;
    }
  }

  return (src) => `<${tag}${attrs}>${escapeHtml(src)}</${tag}>`;
}

/**
 * @param {MarkdownIt} md
 * @returns {(src: string) => string}
 */
function createDefaultRenderer(md) {
  if (globalThis.customElements) {
    // We are in a browser. See if we have some custom elements.
    if (globalThis.customElements.get("math-up")) {
      return createCustomElementRenderer("math-up", md);
    }

    if (globalThis.customElements.get("la-tex")) {
      return createCustomElementRenderer("la-tex", md);
    }
  }

  return createCustomElementRenderer(["span", { class: "math inline" }], md);
}

/**
 * @typedef {(src: string, token?: Token, md?: MarkdownIt) => string} CustomRenderer
 * @typedef {object} PluginOptions
 * @property {number} [minDelims=1]
 * @property {CustomRenderer} [renderer] - Custom renderer. Overwrites the `customElement` option.
 * @property {CustomElementOption} [customElement] - Render to a custom element.
 * @typedef {import("markdown-it").PluginWithOptions<PluginOptions>} Plugin
 */

/** @type {Plugin} */
export default function markdownItMathspan(
  md,
  {
    minDelims = 1,
    customElement,
    renderer = customElement
      ? createCustomElementRenderer(customElement, md)
      : createDefaultRenderer(md),
  } = {},
) {
  md.inline.ruler.after("backticks", "mathspan", createRuler({ minDelims }));

  md.renderer.rules.mathspan = (tokens, idx) =>
    renderer(tokens[idx].content, tokens[idx], md);
}
