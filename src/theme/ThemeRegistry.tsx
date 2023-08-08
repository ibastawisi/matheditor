"use client";
import { useState } from "react";
import createCache, { Options } from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import ThemeProvider from "./ThemeProvider";

// This implementation is from emotion-js
// https://github.com/emotion-js/emotion/issues/2928#issuecomment-1319747902
export default function ThemeRegistry(props: { options: Options; children: React.ReactNode; }) {
  const { options, children } = props;

  const [{ cache, flush }] = useState(() => {
    const cache = createCache(options);
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: { name: string; isGlobal: boolean }[] = [];
    cache.insert = (...args) => {
      const [selector, serialized] = args;
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({
          "name": serialized.name,
          "isGlobal": selector === ""
        });
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const inserted = flush();
    if (inserted.length === 0) {
      return null;
    }
    let styles = "";
    let dataEmotionAttribute = cache.key;

    const globals: {
      name: string;
      style: string;
    }[] = [];

    for (const { name, isGlobal } of inserted) {
      const style = cache.inserted[name];

      if (typeof style === "boolean") {
        continue;
      }

      if (isGlobal) {
        globals.push({ name, style });
      } else {
        styles += style;
        dataEmotionAttribute += ` ${name}`;
      }
    }

    return (
      <>
        {globals.map(({ name, style }) => (
          <style
            key={name}
            data-emotion={`${cache.key}-global ${name}`}
            dangerouslySetInnerHTML={{ "__html": style }}
          />
        ))}
        {styles !== "" && (
          <style
            data-emotion={dataEmotionAttribute}
            dangerouslySetInnerHTML={{ "__html": styles }}
          />
        )}
      </>
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
