import type { Provider } from "@lexical/yjs";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";
import type { CollabStatus } from "@/types";

/** The server turned the token down, most likely because it expired */
const CLOSE_UNAUTHORIZED = 4401;
/** Fresh tokens to try before giving up, reset by every successful sync */
const MAX_TOKEN_REFRESHES = 3;

export interface CollabProviderOptions {
  url: string;
  token: string;
  /** A new token for the same session, or null when the user can no longer join it */
  refreshToken: () => Promise<string | null>;
  onStatus: (status: CollabStatus) => void;
  onSync: (synced: boolean) => void;
  /** The server closed the session for good */
  onClosed: () => void;
  /** Who is in the session changed */
  onAwareness?: (provider: WebsocketProvider) => void;
}

/**
 * Creates the providers that connect a document, named by its id, to the live
 * editing server. Tokens are only checked when a connection opens, so a
 * client that reconnects after its token expired asks for a new one.
 *
 * The collaboration plugin only disconnects the providers it is done with, so
 * `destroy` is for the owner of the factory to call when it unmounts.
 */
export function createProviderFactory(options: CollabProviderOptions) {
  const providers = new Set<WebsocketProvider>();
  let destroyed = false;

  const factory = (id: string, yjsDocMap: Map<string, Doc>): Provider => {
    let doc = yjsDocMap.get(id);
    if (doc === undefined) {
      doc = new Doc();
      yjsDocMap.set(id, doc);
    } else {
      doc.load();
    }

    const provider = new WebsocketProvider(options.url, id, doc, {
      connect: false,
      params: { token: options.token },
    });
    providers.add(provider);

    // destroying a provider still emits its last status and awareness changes, which nobody wants by then
    let refreshes = 0;
    provider.on("status", ({ status }) => {
      if (!destroyed) options.onStatus(status);
    });
    provider.on("sync", (synced) => {
      if (destroyed) return;
      if (synced) refreshes = 0;
      options.onSync(synced);
    });
    provider.on("closed", async ({ code }) => {
      if (destroyed) return;
      if (code !== CLOSE_UNAUTHORIZED || refreshes >= MAX_TOKEN_REFRESHES) return options.onClosed();
      refreshes++;
      const token = await options.refreshToken();
      if (destroyed) return;
      if (!token) return options.onClosed();
      provider.params = { token };
      provider.connect();
    });

    provider.awareness.on("change", () => {
      if (!destroyed) options.onAwareness?.(provider);
    });
    // y-websocket's awareness is a superset of what the Lexical binding reads
    return provider as unknown as Provider;
  };

  const destroy = () => {
    destroyed = true;
    for (const provider of providers) provider.destroy();
    providers.clear();
  };

  return { factory, destroy };
}
