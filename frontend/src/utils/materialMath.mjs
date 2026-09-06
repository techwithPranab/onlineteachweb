function wrapBareFractions(text) {
  const command = /\\(?:dfrac|tfrac|frac)\s*\{/g
  let result = ''
  let lastEnd = 0
  let match
  while ((match = command.exec(text))) {
    let end = command.lastIndex - 1
    let valid = true
    for (let argument = 0; argument < 2; argument += 1) {
      while (/\s/.test(text[end] || '') && end < text.length) end += 1
      if (text[end] !== '{') { valid = false; break }
      let depth = 0
      do {
        const character = text[end++]
        if (character === '\\') end += 1
        else if (character === '{') depth += 1
        else if (character === '}') depth -= 1
      } while (depth > 0 && end < text.length)
      if (depth !== 0) { valid = false; break }
    }
    if (!valid) continue
    result += text.slice(lastEnd, match.index) + '$' + text.slice(match.index, end) + '$'
    lastEnd = end
    command.lastIndex = end
  }
  return result + text.slice(lastEnd)
}

export function normalizeMaterialMath(markdown = '') {
  // Protect code examples and existing math. Convert TeX delimiters before
  // Markdown consumes their backslashes as punctuation escapes.
  const tokens = /(`{3,}|~{3,})[^\n]*\n[\s\S]*?\1|(`+)[^\n]*?\2|\$\$[\s\S]*?\$\$|(?<!\\)\$[^\n$]+?(?<!\\)\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g
  let result = ''
  let lastEnd = 0
  for (const match of markdown.matchAll(tokens)) {
    result += wrapBareFractions(markdown.slice(lastEnd, match.index))
    if (match[3] !== undefined) result += '$' + match[3].trim().replace(/\s*\n\s*/g, ' ') + '$'
    else if (match[4] !== undefined) result += '\n\n$$\n' + match[4].trim() + '\n$$\n\n'
    else result += match[0]
    lastEnd = match.index + match[0].length
  }
  return result + wrapBareFractions(markdown.slice(lastEnd))
}
