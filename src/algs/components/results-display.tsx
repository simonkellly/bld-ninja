import { AlgStore } from "@/algs/logic/alg-store";
import { algDb } from "@/algs/logic/alg-db";
import { useStore } from "@tanstack/react-store";
import { useLiveQuery } from "dexie-react-hooks";
import { Button, Card, CardBody, CardHeader, Chip, cn, ScrollShadow } from "@heroui/react";
import { Trash } from "lucide-react";

const colors = {
  dark: {
    '0.5': 'text-green-500',
    '0.6': 'text-green-600',
    '0.7': 'text-green-700',
    '0.8': 'text-green-800',
    '0.9': 'text-green-900',
    '1.0': 'text-green-950',
    '1.1': 'text-orange-950',
    '1.2': 'text-orange-900',
    '1.3': 'text-red-800',
    '1.4': 'text-red-700',
    '1.5': 'text-red-600',
  },
  light: {
    '0.5': 'dark:text-green-400',
    '0.7': 'dark:text-green-300',
    '0.9': 'dark:text-green-200',
    '1.0': 'dark:text-green-100',
    '1.1': 'dark:text-orange-200',
    '1.2': 'dark:text-orange-300',
    '1.5': 'dark:text-red-600',
  }
}

function getTimeColor(timeInSeconds: number) {
  const lightColor = colors.light;
  const darkColor = colors.dark;

  for (const colorKey in lightColor) {
    const threshold = parseFloat(colorKey);
    if (timeInSeconds < threshold) {
      return {
        light: lightColor[colorKey as keyof typeof lightColor],
        dark: darkColor[colorKey as keyof typeof darkColor]
      };
    }
  }
  
  const lastKey = Object.keys(lightColor).pop() as keyof typeof lightColor;
  return {
    light: lightColor[lastKey],
    dark: darkColor[lastKey]
  };
}

function ResultsList() {
  const currentSet = useStore(AlgStore, state => state.currentSet);
  const results = useLiveQuery(() => 
    algDb.algAttempts.where("set").equals(currentSet).sortBy("timestamp"), 
    [currentSet]
  );

  return (
    <ScrollShadow hideScrollBar size={20}>
      <div className="flex flex-col gap-2 font-medium font-mono">
        {results?.slice(-20)?.map((result) => {
          const timeInSeconds = result.time / 1000;
          const colorClass = getTimeColor(timeInSeconds);
          
          return (
            <div key={result.id} className="flex items-center justify-between">
              <Chip
                className={cn(colorClass.dark, colorClass.light)}
                variant="faded"
                size="md"
              >
                {result.case}: {timeInSeconds.toFixed(2)}s
              </Chip>
              <Button
                variant="bordered"
                size="sm"
                isIconOnly
                onPress={() => {
                  algDb.algAttempts?.delete(result.id);
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          );
        }).reverse()}
      </div>
    </ScrollShadow>
  );
}

export default function ResultsDisplay() {  
  return (
    <Card>
      <CardHeader>
        <h3 className="text-2xl font-bold">Results</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <ResultsList />
      </CardBody>
    </Card>
  );
}