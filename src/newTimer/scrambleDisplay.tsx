import { cn } from "@/lib/utils";

export default function ScrambleDisplay() {
  const scramble = "F2 B2 D F2 L2 F' D2 L U2 L2 U F2 B2 R2 U' F2 U F2 R2 L D'";
  const scrambleIndex = 7;

  return (
    <h2 className="text-1xl sm:text-3xl font-semibold text-center p-4 flex-none select-none">
      {scramble.split(' ').map((move, i) => {
        const className = cn('inline-block px-1 mx-0.5 py-0.5 sm:px-2 sm:mx-1 sm:py-1 rounded-lg', {
          'bg-primary text-primary-foreground': i === scrambleIndex,
          'text-secondary': i < scrambleIndex,
        });
        return (
          <div
            key={scramble.length + move + 'Move' + i}
            className={className}
          >
            <pre>{move.padEnd(2, ' ')}</pre>
          </div>
        );
      })}
    </h2>
  );
}