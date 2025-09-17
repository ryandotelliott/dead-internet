import React, { useEffect, useRef } from "react";

export default function ShadowDom({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: "open" });
    }

    const shadow = shadowRef.current;
    if (!shadow) return;

    while (shadow.firstChild) shadow.removeChild(shadow.firstChild);

    if (!shadow.querySelector("style")) {
      const style = document.createElement("style");
      style.textContent = `
    :host {
      all: initial; /* isolate from outside CSS */
    }
    div[role="document"] {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: var(--foreground);
      background: var(--background);
      margin: 0;
      padding: 1rem;
    }
    div[role="document"] table {
      border-collapse: collapse;
    }
    div[role="document"] img {
      max-width: 100%;
      height: auto;
    }
    div[role="document"] a {
      color: #00f;
      text-decoration: underline;
    }
  `;
      shadow.prepend(style);
    }

    const container = document.createElement("div");
    container.setAttribute("role", "document");
    container.innerHTML = html;
    shadow.appendChild(container);

    return () => {
      while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
    };
  }, [html]);

  return <div ref={hostRef} className="w-full h-full overflow-auto" />;
}
