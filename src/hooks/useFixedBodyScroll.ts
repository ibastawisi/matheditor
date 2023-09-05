import { useEffect, useRef } from "react";

export default function useFixedBodyScroll(isFixed: boolean) {
  const scrollTop = useRef(0);
  useEffect(() => {
    if (!isFixed && !scrollTop.current) return;
    if (isFixed) {
      scrollTop.current = Math.round(document.documentElement.scrollTop);
      document.body.style.top = `-${scrollTop.current}px`;
      document.body.style.position = "fixed";
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.documentElement.scrollTop = scrollTop.current;
    }
  }, [isFixed]);
}