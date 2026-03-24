import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env } from "@flowcamp/env/web";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { Agentation } from "agentation";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";

import { authClient } from "@/lib/auth-client";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loader />,
  context: {
    // Placeholder values. We overwrite these dynamically in `InnerApp` and call `router.invalidate()`
    // so route `beforeLoad` hooks see the latest auth state.
    auth: {
      isAuthenticated: false,
      isLoading: true,
    },
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // TanStack Router's context isn't a "live" React context; we need to invalidate to recompute
  // loaders/beforeLoad with updated context values.
  useEffect(() => {
    router.invalidate();
  }, [isAuthenticated, isLoading]);

  return (
    <RouterProvider
      router={router}
      context={{
        auth: { isAuthenticated, isLoading },
      }}
    />
  );
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <InnerApp />
      </ConvexBetterAuthProvider>
      {import.meta.env.DEV && <Agentation />}
    </>,
  );
}
