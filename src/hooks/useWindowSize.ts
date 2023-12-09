import { useState, useLayoutEffect } from "react";

export function useWindowSize(): { width: number | null; height: number | null } {
  const [size, setSize] = useState<{
    width: number | null; height: number | null
  }>({
    width: null,
    height: null,
  });

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
}