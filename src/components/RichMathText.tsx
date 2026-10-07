"use client";

import { type ReactNode } from "react";

/** 将常见 LaTeX 符号转成可读字符（不含 frac，frac 单独渲染） */
function cleanLatexSymbols(raw: string): string {
  return raw
    .replace(/\\dfrac|\\tfrac|\\cfrac/g, "\\frac")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\cdot/g, "·")
    .replace(/\\pm/g, "±")
    .replace(/\\mp/g, "∓")
    .replace(/\\leq|\\le\b/g, "≤")
    .replace(/\\geq|\\ge\b/g, "≥")
    .replace(/\\neq|\\ne\b/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\infty/g, "∞")
    .replace(/\\pi\b/g, "π")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\sqrt\s*([0-9.]+)/g, "√$1")
    .replace(/\^\{([^{}]+)\}/g, "⁽$1⁾")
    .replace(/\^([0-9a-zA-Z])/g, "⁽$1⁾")
    .replace(/_\{([^{}]+)\}/g, "₍$1₎")
    .replace(/_([0-9a-zA-Z])/g, "₍$1₎")
    .replace(/\\ldots|\\dots/g, "…")
    .replace(/\\%/g, "%")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\!/g, "")
    .replace(/\\quad|\\qquad/g, " ")
    .replace(/\\left|\\right/g, "")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\mathrm\{([^{}]*)\}/g, "$1")
    .replace(/\\mathbf\{([^{}]*)\}/g, "$1")
    .trim();
}

function Frac({ num, den }: { num: string; den: string }) {
  return (
    <span
      className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.9em] leading-none"
      style={{ verticalAlign: "-0.15em" }}
    >
      <span className="border-b border-current px-1 pb-px">{num}</span>
      <span className="px-1 pt-px">{den}</span>
    </span>
  );
}

/** 普通文本里的 a/b 也画成分数（避开小数点粘连，如 0.5/2 仍渲染） */
function plainTextToNodes(text: string, keyPrefix: string): ReactNode[] {
  if (!text) return [];
  const nodes: ReactNode[] = [];
  const re = /(^|[^\d.])(\d+)\/(\d+)(?!\d)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    const prefix = m[1];
    const start = m.index + prefix.length;
    if (start > last || prefix) {
      const before = text.slice(last, start);
      if (before) nodes.push(<span key={`${keyPrefix}-t${i++}`}>{before}</span>);
    }
    nodes.push(<Frac key={`${keyPrefix}-f${i++}`} num={m[2]} den={m[3]} />);
    last = start + m[2].length + 1 + m[3].length;
  }
  if (last < text.length) {
    nodes.push(<span key={`${keyPrefix}-t${i++}`}>{text.slice(last)}</span>);
  }
  return nodes;
}

/** 把一段 LaTeX（已去掉 $ 定界）拆成文本 + 分数节点 */
function latexInnerToNodes(tex: string, keyPrefix: string): ReactNode[] {
  const cleaned = cleanLatexSymbols(tex);
  const nodes: ReactNode[] = [];
  const re = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(cleaned)) !== null) {
    if (m.index > last) {
      const plain = cleaned.slice(last, m.index).replace(/[{}]/g, "");
      nodes.push(...plainTextToNodes(plain, `${keyPrefix}-p${i++}`));
    }
    nodes.push(
      <Frac
        key={`${keyPrefix}-f${i++}`}
        num={cleanLatexSymbols(m[1]).replace(/[{}]/g, "")}
        den={cleanLatexSymbols(m[2]).replace(/[{}]/g, "")}
      />
    );
    last = m.index + m[0].length;
  }
  if (last < cleaned.length) {
    const plain = cleaned.slice(last).replace(/[{}]/g, "");
    nodes.push(...plainTextToNodes(plain, `${keyPrefix}-p${i++}`));
  }
  return nodes;
}

/**
 * 渲染含公式的文本：支持 $...$ / $$...$$ / \\(...\\) / \\[...\\]、
 * 裸 \\frac / \\dfrac、普通 a/b 分数、**加粗**。
 */
export function RichMathText({ text }: { text: string }) {
  if (!text) return null;

  const pattern =
    /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\\(?:d|t|c)?frac\{([^{}]+)\}\{([^{}]+)\}|\*\*([^*]+)\*\*/g;

  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(...plainTextToNodes(text.slice(last, m.index), `p${i++}`));
    }

    if (m[7] !== undefined) {
      nodes.push(
        <strong key={`b${i++}`} className="font-semibold">
          <RichMathText text={m[7]} />
        </strong>
      );
    } else if (m[5] !== undefined && m[6] !== undefined) {
      nodes.push(
        <Frac
          key={`f${i++}`}
          num={cleanLatexSymbols(m[5]).replace(/[{}]/g, "")}
          den={cleanLatexSymbols(m[6]).replace(/[{}]/g, "")}
        />
      );
    } else {
      const inner = m[1] ?? m[2] ?? m[3] ?? m[4] ?? "";
      nodes.push(<span key={`m${i++}`}>{latexInnerToNodes(inner, `m${i}`)}</span>);
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) {
    nodes.push(...plainTextToNodes(text.slice(last), `p${i++}`));
  }

  return <>{nodes}</>;
}
