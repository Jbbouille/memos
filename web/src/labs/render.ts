import { marked } from "marked";
import DOMPurify from "dompurify";

export const HASH_TAGS = /(^\s)?(#[\w-]+)/gm;
export const HASH_TAG = /^#[\w-]+$/;
export const LINK_REG = /\[([^\]]+)]\(([^)]+)\)/;
export const TAG_REG = /#([^\s#]+)/;
export const TAG_REG_GLOBAL = /#([^\s#]+)/g;
export const LINE_BREAK = /\n|\r|\r\n/g;
export const PLAIN_LINK_REG = /((?:https?|chrome|edge):\/\/[^ ]+)/;

const endsOneOrMoreWhitespace = /\s+$/;

const renderer = {
  paragraph,
  code,
  link,
  listitem,
  checkbox,
};

const originalRender = new marked.Renderer();
let indexListItem = 0;

marked.use({ renderer, headerIds: false, mangle: false });

function checkbox(): string {
  return "";
}

function randomId(): string {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  return btoa(`${uint32.toString(16)}-${Date.now()}`);
}

function listitem(text: string, task: boolean, checked: boolean): string {
  let result = originalRender.listitem(text, task, checked).replaceAll("<li>", '<li class="li-simple">');

  if (task) {
    const checkedValue = checked ? "checked" : "";
    const id = randomId();
    result = `<li class="flex flex-row"><input type="checkbox" class="todo-block" data-memo-todo-id="${indexListItem}" id="${id}" ${checkedValue}><label for="${id}">${text}</label></li>`;
    indexListItem++;
  }
  return result;
}

function code(code: string, infostring: string, escaped: boolean): string {
  return originalRender
    .code(code, infostring, escaped)
    .replace(
      "<pre>",
      `<pre class="group"><button class="text-xs font-mono italic absolute top-0 right-0 px-2 leading-6 border btn-text rounded opacity-0 group-hover:opacity-60">copy</button>`
    )
    .replace('<code class="language-mermaid"', `<span hidden>${code}</span><code class="language-mermaid"`);
}

function link(href: string | null, title: string | null, text: string): string {
  return originalRender.link(href, title, text).replace("<a", `<a class="link" target="_blank"`);
}

function mapHashToHtml(hash: string): { tag: string; html: string } {
  const html = `<span class="tag-span">${hash}</span>`;
  return { tag: hash, html };
}

function paragraph(rawText: string): string {
  let paragraph = rawText;
  const keyValues = (rawText.match(HASH_TAGS) || []).map((h) => mapHashToHtml(h));
  for (const keyValue of keyValues) {
    paragraph = paragraph.replaceAll(keyValue.tag, keyValue.html);
  }
  paragraph = paragraph
    .split(LINE_BREAK)
    .map((p) => (endsOneOrMoreWhitespace.test(p) ? `<p>${p}</p><br>` : `<p>${p}</p>`))
    .join("");
  return paragraph;
}

export function renderMarkdown(md: string): string {
  indexListItem = 0;
  return DOMPurify.sanitize(marked(md), { ADD_ATTR: ["target"] });
}
