import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: "2rem", fontFamily: "system-ui", color: "#2e2e42" }}>
          <h1>Unable to load the application</h1>
          <p>{this.state.error.message}</p>
        </main>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root")!);

function showStartupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  root.render(
    <main style={{ padding: "2rem", fontFamily: "system-ui", color: "#2e2e42" }}>
      <h1>Unable to start the application</h1>
      <p>{message}</p>
    </main>
  );
}

try {
  root.render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Application startup failed", error);
  showStartupError(error);
}
