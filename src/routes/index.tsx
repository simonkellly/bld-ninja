import { createFileRoute } from '@tanstack/react-router';
import bldNinjaLogo from '/bldninja-logo-v1.svg';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <main className="flex p-20 w-full items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-6">
        <img src={bldNinjaLogo} alt="BLD Ninja logo" className="w-96" />
        <h1 className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-gray-50 sm:text-5xl md:text-6xl">
          Under Construction
        </h1>
        <p className="max-w-[400px] text-center text-gray-500 dark:text-gray-400 md:text-lg">
          We're hard at work, building something amazing for you. Please check
          back soon for our grand opening!
        </p>
      </div>
    </main>
  );
}
