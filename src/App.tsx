import { useEffect, useState } from "react";
import { ThemeProvider } from "./theme";
import Landing from "./screens/Landing";
import Board from "./screens/Board";

export default function App() {
  const [view, setView] = useState<"landing" | "board">(() => {
    return window.location.hash === "#board" ? "board" : "landing";
  });

  useEffect(() => {
    const onHash = () => setView(window.location.hash === "#board" ? "board" : "landing");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <ThemeProvider>
      {view === "landing" ? (
        <Landing
          onEnter={() => {
            window.location.hash = "board";
          }}
        />
      ) : (
        <Board onLogo={() => (window.location.hash = "")} />
      )}
    </ThemeProvider>
  );
}
