import { useEffect } from 'react'
import { useAccessibility } from '../accessibility/useAccessibility'
import { translateToEnglish } from './translations'

const translatedText = new WeakMap<Text, { french: string; english: string }>()
const translatedAttributes = new WeakMap<Element, Map<string, { french: string; english: string }>>()
const translatedProperties = new WeakMap<HTMLInputElement | HTMLTextAreaElement, { french: string; english: string }>()
const attributes = ['aria-label', 'title', 'alt', 'placeholder']

function preserveSpacing(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] ?? ''
  const trailing = source.match(/\s*$/)?.[0] ?? ''
  return `${leading}${translated}${trailing}`
}

function translateTextNode(node: Text) {
  const current = node.nodeValue ?? ''
  const existing = translatedText.get(node)
  if (existing?.english === current) return

  const translated = translateToEnglish(current)
  if (!translated) return

  const english = preserveSpacing(current, translated)
  translatedText.set(node, { french: current, english })
  node.nodeValue = english
}

function translateElementAttributes(element: Element) {
  for (const attribute of attributes) {
    const current = element.getAttribute(attribute)
    if (!current) continue

    const existing = translatedAttributes.get(element)?.get(attribute)
    if (existing?.english === current) continue

    const translated = translateToEnglish(current)
    if (!translated) continue

    const values = translatedAttributes.get(element) ?? new Map()
    values.set(attribute, { french: current, english: translated })
    translatedAttributes.set(element, values)
    element.setAttribute(attribute, translated)
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const existing = translatedProperties.get(element)
    if (existing?.english === element.placeholder) return
    const translated = translateToEnglish(element.placeholder)
    if (translated) {
      translatedProperties.set(element, { french: element.placeholder, english: translated })
      element.placeholder = translated
    }
  }
}

function walkAndTranslate(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text)
    return
  }

  if (!(root instanceof Element) && root !== document.body) return
  if (root instanceof Element) translateElementAttributes(root)

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text)
    else translateElementAttributes(node as Element)
    node = walker.nextNode()
  }
}

function restoreFrench(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    const textNode = root as Text
    const values = translatedText.get(textNode)
    if (values && textNode.nodeValue === values.english) textNode.nodeValue = values.french
    return
  }

  if (!(root instanceof Element) && root !== document.body) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)

  const restoreElement = (element: Element) => {
    const values = translatedAttributes.get(element)
    values?.forEach((translation, attribute) => {
      if (element.getAttribute(attribute) === translation.english) element.setAttribute(attribute, translation.french)
    })

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const property = translatedProperties.get(element)
      if (property && element.placeholder === property.english) element.placeholder = property.french
    }
  }

  if (root instanceof Element) restoreElement(root)
  let node = walker.nextNode()
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text
      const values = translatedText.get(textNode)
      if (values && textNode.nodeValue === values.english) textNode.nodeValue = values.french
    } else {
      restoreElement(node as Element)
    }
    node = walker.nextNode()
  }
}

export function DocumentTranslationBridge() {
  const { language } = useAccessibility()

  useEffect(() => {
    let applying = false
    const apply = (root: Node) => {
      if (applying) return
      applying = true
      if (language === 'en') walkAndTranslate(root)
      else restoreFrench(root)
      applying = false
    }

    apply(document.body)

    const observer = new MutationObserver((mutations) => {
      if (applying) return
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') apply(mutation.target)
        mutation.addedNodes.forEach(apply)
        if (mutation.type === 'attributes') apply(mutation.target)
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: attributes,
      characterData: true,
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [language])

  return null
}
