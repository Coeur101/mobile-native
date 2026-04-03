import { useEffect, useState } from "react";

/**
 * 通过 visualViewport API 感知软键盘高度。
 * 键盘弹出时 visualViewport.height 会缩小，差值即为键盘高度。
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function onResize() {
      const height = Math.max(0, window.innerHeight - viewport!.height);
      setKeyboardHeight(height);
    }

    viewport.addEventListener("resize", onResize);
    viewport.addEventListener("scroll", onResize);
    return () => {
      viewport.removeEventListener("resize", onResize);
      viewport.removeEventListener("scroll", onResize);
    };
  }, []);

  return keyboardHeight;
}
