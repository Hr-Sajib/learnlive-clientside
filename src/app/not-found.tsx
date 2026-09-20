import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-neutral-100">Page not found</h1>
        <p className="mt-2 text-sm text-neutral-70">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
