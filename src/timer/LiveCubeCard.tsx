import BTCubeDisplay from '@/components/cubing/btCubeDisplay';
import CubeName from '@/components/cubing/cubeName';
import { Badge } from '@/components/ui/badge';

export default function LiveCubeCard() {
  return (
    <fieldset className="bg-card rounded-lg border px-4 col-span-1 h-72">
      <legend className="">
        <Badge variant="outline" className="bg-background">
          <CubeName />
        </Badge>
      </legend>
      <BTCubeDisplay className="w-full h-full m-auto" />
    </fieldset>
  );
}
