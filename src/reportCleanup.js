function decodeEntities(text) {
  if (!text || !text.includes('&')) return text

  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

function cleanTextNode(node) {
  const value = node.nodeValue

  if (
    !value ||
    !value.includes('&') ||
    !/&(?:amp|quot|apos|lt|gt|nbsp|#\d+|#x[\da-f]+);/i.test(value)
  ) {
    return
  }

  const cleaned = decodeEntities(value)

  if (cleaned !== value) {
    node.nodeValue = cleaned
  }
}

function cleanReportText(root = document.body) {
  if (!root) return

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement

        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT
        }

        return NodeFilter.FILTER_ACCEPT
      },
    },
  )

  const textNodes = []

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode)
  }

  textNodes.forEach(cleanTextNode)
}

document.addEventListener('DOMContentLoaded', () => {
  cleanReportText()

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          cleanTextNode(node)
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          cleanReportText(node)
        }
      })
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
})
