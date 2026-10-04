/* next/dynamic in the embed build: React.lazy behind a Suspense. The embed
   renders in the browser only, so `ssr: false` needs no handling. */
import { Suspense, lazy, type ComponentType } from "react";

export default function dynamic<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  const Lazy = lazy(load);
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
