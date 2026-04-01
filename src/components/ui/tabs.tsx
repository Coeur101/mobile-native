import {
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used inside <Tabs />.");
  }
  return context;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className="flex flex-col gap-2">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="tablist" {...props} className={`inline-flex items-center gap-1 ${className}`.trim()} />;
}

interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className = "", children, ...props }: TabsTriggerProps) {
  const context = useTabsContext();
  const isActive = context.value === value;

  return (
    <button
      {...props}
      type="button"
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => context.onValueChange(value)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          const triggers = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]");
          if (!triggers) return;
          const list = Array.from(triggers);
          const currentIndex = list.indexOf(event.currentTarget);
          const nextIndex = event.key === "ArrowRight"
            ? (currentIndex + 1) % list.length
            : (currentIndex - 1 + list.length) % list.length;
          const next = list[nextIndex];
          next.focus();
          next.click();
        }
      }}
      className={[
        "relative flex-1 px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, children, ...props }: TabsContentProps) {
  const context = useTabsContext();

  if (context.value !== value) {
    return null;
  }

  return <div role="tabpanel" {...props}>{children}</div>;
}
