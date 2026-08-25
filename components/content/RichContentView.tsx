"use client";

import { useEffect, useRef } from "react";

interface RichContentViewProps {
  html: string;
  className?: string;
}

export function RichContentView({
  html,
  className = "article-content",
}: RichContentViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const blocks = container.querySelectorAll("pre");

    blocks.forEach((pre) => {
      if (pre.querySelector(".hcx-copy-code-button")) {
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "hcx-code-block-wrap";

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "hcx-copy-code-button rounded border border-hcx-border bg-hcx-card px-2 py-1 text-xs font-medium text-hcx-text-secondary hover:text-hcx-cyan";
      button.setAttribute("aria-label", "Copy code");
      button.textContent = "Copy";

      button.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, 1500);
        } catch {
          button.textContent = "Failed";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, 1500);
        }
      });

      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(button);
      wrapper.appendChild(pre);
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
