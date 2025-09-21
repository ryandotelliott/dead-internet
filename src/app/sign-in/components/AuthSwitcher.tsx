"use client";

import { useLayoutEffect, useRef, useState } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

export default function AuthSwitcher() {
  const [isSignUp, setIsSignUp] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const setHeight = () => {
      const computedStyle = getComputedStyle(container);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);
      const totalHeight = content.offsetHeight + paddingTop + paddingBottom;
      container.style.height = `${totalHeight}px`;
    };

    setHeight();

    const resizeObserver = new ResizeObserver(() => {
      setHeight();
    });

    resizeObserver.observe(content);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isSignUp]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-y-4 overflow-hidden transition-[height] duration-200 ease-in-out p-2"
    >
      <div ref={contentRef} className="flex flex-col gap-y-4 ">
        <h1 className="text-xl font-semibold">
          {isSignUp ? "Create your account" : "Sign in"}
        </h1>
        {isSignUp ? (
          <SignUpForm
            onToggle={() => setIsSignUp(false)}
            toggleLabel="Already have an account? Sign in"
          />
        ) : (
          <SignInForm
            onToggle={() => setIsSignUp(true)}
            toggleLabel="Don't have an account? Sign up"
          />
        )}
      </div>
    </div>
  );
}
