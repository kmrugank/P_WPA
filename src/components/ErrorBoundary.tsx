import { Component, type ReactNode } from "react";
import { Brand } from "./UI";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="loading-screen">
        <Brand />
        <h1>Let’s try again.</h1>
        <p role="alert">
          Lunara could not display this screen. Your saved local records have
          not been reset. Reload the app to try again.
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload Lunara
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
