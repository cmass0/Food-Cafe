import {
  $applyNodeReplacement,
  TextNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
} from "lexical";

export type SerializedMentionNode = Spread<
  {
    mentionId?: string | null;
    mentionName: string;
  },
  SerializedTextNode
>;

function mentionNameFromElement(domNode: HTMLElement): string | null {
  const storedName = domNode.getAttribute("data-lexical-mention-name")?.trim();
  if (storedName) return storedName;
  const textContent = domNode.textContent?.trim();
  return textContent ? textContent.replace(/^@/, "") : null;
}

function $convertMentionElement(domNode: HTMLElement): DOMConversionOutput | null {
  const mentionName = mentionNameFromElement(domNode);
  if (!mentionName) return null;

  const mentionId = domNode.getAttribute("data-lexical-mention-id");
  return {
    node: $createMentionNode(mentionName, mentionId),
  };
}

const mentionStyle = "background-color: rgba(24, 119, 232, 0.2)";

export class MentionNode extends TextNode {
  __mentionId: string | null;
  __mentionName: string;

  static getType(): string {
    return "mention";
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mentionName, node.__mentionId, node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const node = $createMentionNode(serializedNode.mentionName, serializedNode.mentionId ?? null);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(mentionName: string, mentionId: string | null = null, text?: string, key?: NodeKey) {
    super(text ?? `@${mentionName}`, key);
    this.__mentionId = mentionId;
    this.__mentionName = mentionName;
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionId: this.__mentionId,
      mentionName: this.__mentionName,
      type: "mention",
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.cssText = mentionStyle;
    dom.className = "mention";
    dom.setAttribute("data-lexical-mention", "true");
    dom.setAttribute("data-lexical-mention-name", this.__mentionName);
    if (this.__mentionId) {
      dom.setAttribute("data-lexical-mention-id", this.__mentionId);
    }
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = this.__mentionId ? document.createElement("a") : document.createElement("span");
    element.setAttribute("data-lexical-mention", "true");
    element.setAttribute("data-lexical-mention-name", this.__mentionName);
    element.className = "mention";
    element.textContent = this.__text;

    if (this.__mentionId) {
      element.setAttribute("data-lexical-mention-id", this.__mentionId);
      element.setAttribute("href", `/profile/${encodeURIComponent(this.__mentionId)}`);
    }
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    const conversion = (domNode: HTMLElement) => {
      if (!domNode.hasAttribute("data-lexical-mention")) return null;
      return {
        conversion: $convertMentionElement,
        priority: 1 as const,
      };
    };

    return {
      a: conversion,
      span: conversion,
    };
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createMentionNode(
  mentionName: string,
  mentionId: string | null = null
): MentionNode {
  const mentionNode = new MentionNode(mentionName, mentionId);
  mentionNode.setMode("segmented").toggleDirectionless();
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode;
}
