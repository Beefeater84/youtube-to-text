import { HorizontalRule } from './horizontal-rule';

export function Footer() {
  return (
    <footer className="mt-16 pb-8">
      <HorizontalRule variant="double" />
      <p className="text-center font-meta text-xs tracking-widest text-muted py-4">
        &copy; MMXXVI YouTube to Text. All rights reserved.
      </p>
    </footer>
  );
}
