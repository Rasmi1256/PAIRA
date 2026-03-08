const normalizeWsBase = (base: string): string =>
  base
    .replace(/^https:/i, "wss:")
    .replace(/^http:/i, "ws:")
    .replace(/\/api\/v1\/?$/i, "")
    .replace(/\/api\/?$/i, "")
    .replace(/\/$/, "");

const resolveConfiguredBase = (): string | null => {
  const explicitWs =
    import.meta.env.VITE_WS_URL ||
    import.meta.env.REACT_APP_WEBSOCKET_URL ||
    import.meta.env.REACT_APP_WS_URL;

  if (explicitWs) {
    return explicitWs;
  }

  const backendBase =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.REACT_APP_API_URL ||
    import.meta.env.VITE_API_BASE_URL;

  if (!backendBase) {
    return null;
  }

  if (backendBase.startsWith("/")) {
    return `${window.location.origin}${backendBase}`;
  }

  return backendBase;
};

export const buildVideoCallWsUrl = (
  authToken: string
): string => {
  const fallbackBase =
    window.location.protocol === "https:"
      ? `wss://${window.location.host}`
      : `ws://${window.location.host}`;

  let wsBase = normalizeWsBase(
    resolveConfiguredBase() || fallbackBase
  );

  if (/\/ws\/video-call$/i.test(wsBase)) {
    return `${wsBase}?token=${encodeURIComponent(authToken)}`;
  }

  if (/\/ws$/i.test(wsBase)) {
    return `${wsBase}/video-call?token=${encodeURIComponent(
      authToken
    )}`;
  }

  return `${wsBase}/ws/video-call?token=${encodeURIComponent(
    authToken
  )}`;
};
