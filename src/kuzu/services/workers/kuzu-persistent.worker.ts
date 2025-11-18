/**
 * Entry shim for the persistent Kuzu worker.
 * React Router's dev HMR runtime expects `window` to exist, but a worker
 * only exposes `self`. We polyfill the minimal globals before loading the
 * actual implementation to keep dev builds happy.
 */

type MinimalDocNode = {
  style: Record<string, unknown>;
  setAttribute: (...args: unknown[]) => void;
  remove: () => void;
  appendChild?: (...args: unknown[]) => void;
  removeChild?: (...args: unknown[]) => void;
};

const createStubNode = (): MinimalDocNode => ({
  style: {},
  setAttribute: () => {},
  remove: () => {},
});

type DocumentShim = {
  createElement?: (tag: string) => MinimalDocNode;
  head?: {
    appendChild?: (...args: unknown[]) => void;
    removeChild?: (...args: unknown[]) => void;
  };
  body?: {
    appendChild?: (...args: unknown[]) => void;
    removeChild?: (...args: unknown[]) => void;
  };
  documentElement?: MinimalDocNode;
  querySelector?: (...args: unknown[]) => null;
  querySelectorAll?: (...args: unknown[]) => [];
  addEventListener?: (...args: unknown[]) => void;
  removeEventListener?: (...args: unknown[]) => void;
};

type WorkerShimGlobal = Omit<
  typeof globalThis,
  "window" | "self" | "document" | "$RefreshReg$" | "$RefreshSig$"
> & {
  window?: Window & typeof globalThis;
  self?: Window & typeof globalThis;
  document?: DocumentShim;
  $RefreshReg$?: (type: unknown, id: string) => void;
  $RefreshSig$?: () => (type: unknown) => unknown;
  __vite_plugin_react_preamble_installed__?: boolean;
};

type OnMessageHandler = (
  this: Window & typeof globalThis,
  ev: MessageEvent<any>
) => any;

const globalScope = globalThis as unknown as WorkerShimGlobal;

const windowShim = globalScope as unknown as Window & typeof globalThis;

if (typeof globalScope.window === "undefined") {
  globalScope.window = windowShim;
}

if (typeof globalScope.self === "undefined") {
  globalScope.self = windowShim;
}

// React Refresh expects these globals; provide fallbacks if the runtime
// preamble hasn't run inside the worker context.
globalScope.$RefreshReg$ ??= () => {};
globalScope.$RefreshSig$ ??= () => (type) => type;
globalScope.__vite_plugin_react_preamble_installed__ ??= true;

type QueuedMessageEvent = MessageEvent<any>;
const queuedMessages: QueuedMessageEvent[] = [];
const queueingHandler: OnMessageHandler = function (event) {
  queuedMessages.push(event);
};

const flushQueuedMessages = () => {
  const handler = globalScope.onmessage as OnMessageHandler | null;
  if (
    typeof handler === "function" &&
    handler !== queueingHandler &&
    queuedMessages.length > 0
  ) {
    const messages = queuedMessages.splice(0);
    for (const message of messages) {
      handler.call(windowShim, message);
    }
  }
};

globalScope.onmessage = queueingHandler as typeof globalScope.onmessage;

// Some dev-only helpers touch `document` to inject style tags. Provide a stub.
if (typeof globalScope.document === "undefined") {
  globalScope.document = {
    createElement: () => createStubNode(),
    head: { appendChild: () => {}, removeChild: () => {} },
    body: { appendChild: () => {}, removeChild: () => {} },
    documentElement: createStubNode(),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  };
} else {
  globalScope.document.createElement ??= () => createStubNode();
  globalScope.document.head ??= {
    appendChild: () => {},
    removeChild: () => {},
  };
  globalScope.document.body ??= {
    appendChild: () => {},
    removeChild: () => {},
  };
  globalScope.document.documentElement ??= createStubNode();
  globalScope.document.querySelector ??= () => null;
  globalScope.document.querySelectorAll ??= () => [];
  globalScope.document.addEventListener ??= () => {};
  globalScope.document.removeEventListener ??= () => {};
}

import("./kuzu-persistent.worker.impl")
  .then(() => {
    flushQueuedMessages();
  })
  .catch((error) => {
    console.error("[Worker] Failed to initialize implementation:", error);
    throw error;
  });

export {};
