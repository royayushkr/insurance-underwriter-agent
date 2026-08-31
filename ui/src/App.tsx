import { useState, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import SearchForm from "./components/SearchForm";
import ProgressTracker from "./components/ProgressTracker";
import ResultsDashboard from "./components/ResultsDashboard";
import {
  CategoriesState,
  CategoryKey,
  initialCategoriesState,
} from "./types";

// Use the deployed API by default so production never falls back to localhost.
const API_URL = (
  import.meta.env.VITE_API_URL || "https://insurance-underwriter-agent-api.vercel.app"
).replace(/\/$/, "");

export default function App() {
  const [categories, setCategories] = useState<CategoriesState>(
    initialCategoriesState()
  );
  const [isResearching, setIsResearching] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [hasResults, setHasResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const blankCategoryState = () => ({
    status: "pending" as const,
    data: null,
    sources: [],
    progressMessage: "",
  });

  const handleSearch = useCallback(
    async (name: string, location: string) => {
      // Reset state
      setCategories(initialCategoriesState());
      setIsResearching(true);
      setCompanyName(name);
      setHasResults(false);
      setErrorMessage("");
      setIsDemoMode(false);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`${API_URL}/api/underwrite/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: name,
            location: location || undefined,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Research request failed (${response.status})`);
        }
        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                handleEvent(event);
              } catch {
                // skip malformed lines
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const message = err instanceof Error ? err.message : "Unable to complete research";
          console.error("Stream error:", err);
          setErrorMessage(`${message}. Check that the backend is running and configured.`);
        }
      } finally {
        setIsResearching(false);
      }
    },
    []
  );

  const handleEvent = useCallback((event: any) => {
    const cat = event.category as CategoryKey | "leadership_linkedin" | undefined;

    switch (event.type) {
      case "start":
        setIsDemoMode(event.mode === "demo");
        break;

      case "progress":
        if (cat) {
          setCategories((prev) => ({
            ...prev,
            [cat]: {
              ...(prev[cat] ?? blankCategoryState()),
              status: "in_progress" as const,
              progressMessage: event.message || "",
            },
          }));
        }
        break;

      case "sources_found":
        if (cat) {
          setCategories((prev) => ({
            ...prev,
            [cat]: {
              ...(prev[cat] ?? blankCategoryState()),
              sources: [
                ...(prev[cat]?.sources ?? []),
                ...(event.sources || []),
              ],
            },
          }));
        }
        break;

      case "category_complete":
        if (cat) {
          setCategories((prev) => ({
            ...prev,
            [cat]: {
              status: "completed" as const,
              data: event.data || {},
              sources: event.sources || prev[cat]?.sources || [],
              progressMessage: "",
            },
          }));
          setHasResults(true);
        }
        break;

      case "error":
        if (cat) {
          setCategories((prev) => ({
            ...prev,
            [cat]: {
              ...(prev[cat] ?? blankCategoryState()),
              status: "error" as const,
              progressMessage: event.message || "An error occurred",
            },
          }));
        }
        break;

      case "complete":
        // Final event — all done
        setIsResearching(false);
        break;
    }
  }, []);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsResearching(false);
  }, []);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Background image layer */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/underwriter-grid-background.png)',
          opacity: 1,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <Header />

        <div className="mt-10">
          <SearchForm
            onSearch={handleSearch}
            isLoading={isResearching}
            onCancel={handleCancel}
          />
          {errorMessage && (
            <div className="mt-3 rounded-xl border border-red-300 bg-white/90 px-4 py-3 text-sm text-red-700 shadow-sm">
              {errorMessage}
            </div>
          )}
          {isDemoMode && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm text-[#5f4b16] shadow-sm">
              Demo mode is active: the Tavily API key was removed, so no live research or API charges will occur.
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isResearching && (
            <ProgressTracker
              key="progress"
              categories={categories}
              companyName={companyName}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasResults && (
            <ResultsDashboard
              key="results"
              categories={categories}
              companyName={companyName}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
