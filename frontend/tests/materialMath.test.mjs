import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { normalizeMaterialMath } from '../src/utils/materialMath.mjs'

const fraction = String.raw`\frac{3}{5} + \frac{4}{5}`
const render = content => renderToStaticMarkup(React.createElement(ReactMarkdown, {
  remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex]
}, normalizeMaterialMath(content)))

for (const [name, content] of [
  ['TeX inline delimiters', `\\(${fraction}\\)`],
  ['TeX display delimiters', `\\[${fraction}\\]`],
  ['dollar delimiters', `$${fraction}$`],
  ['display dollars', `$$\n${fraction}\n$$`],
  ['bare fractions from existing material', `${fraction} )`],
  ['nested fractions', String.raw`\frac{1}{\frac{2}{3}}`]
]) {
  test(name, () => {
    const html = render(content)
    assert.match(html, /class="katex"/)
    assert.match(html, /<mfrac>/)
    assert.doesNotMatch(html, /katex-error/)
  })
}

test('preserves code, existing math, currency, and ordinary prose', () => {
  for (const content of [
    '`' + fraction + '`', '```latex\n' + fraction + '\n```',
    '~~~latex\n' + fraction + '\n~~~', `$${fraction}$`,
    'Price: $5.00. Read (chapter 3).', String.raw`Incomplete: \frac{3}`
  ]) assert.equal(normalizeMaterialMath(content), content)
})

test('converting math is idempotent', () => {
  const once = normalizeMaterialMath(`\\(${fraction}\\) and ${fraction}`)
  assert.equal(normalizeMaterialMath(once), once)
})
