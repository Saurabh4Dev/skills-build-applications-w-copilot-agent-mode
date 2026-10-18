import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  emptyText: string;
  state: { status: 'loading' } | { status: 'error'; message: string } | { status: 'success' };
  isEmpty?: boolean;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, emptyText, state, isEmpty, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {state.message}</p>}
        {state.status === 'success' && isEmpty && <p>{emptyText}</p>}
        {state.status === 'success' && !isEmpty && children}
      </div>
    </section>
  );
}
