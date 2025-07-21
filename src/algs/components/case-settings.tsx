import { Button, ButtonGroup, Checkbox, NumberInput, Select, SelectItem, Skeleton } from "@heroui/react";
import { useStore } from "@tanstack/react-store";
import { AlgStore, setCurrentSet } from "@/algs/logic/alg-store";
import { useCheckbox, CheckboxGroup, Chip, VisuallyHidden, tv } from "@heroui/react";
import type { CheckboxProps } from "@heroui/react";
import { Check, X } from "lucide-react";
import { ALG_SETS } from "@/algs/logic/algs";
import { MoveStore } from "@/algs/logic/use-alg-trainer";

export const CustomCheckbox = (props: CheckboxProps) => {
  const checkbox = tv({
    slots: {
      base: "border-default hover:bg-default-200",
      content: "text-foreground font-mono",
    },
    variants: {
      isSelected: {
        true: {
          base: "border-primary bg-primary hover:bg-primary-500 hover:border-primary-500",
          content: "text-primary-foreground pl-1",
        },
        false: {
          content: "text-foreground pl-1",
        }
      },
      isFocusVisible: {
        true: {
          base: "outline-hidden ring-2 ring-focus ring-offset-2 ring-offset-background",
        },
      },
    },
  });

  const {children, isSelected, isFocusVisible, getBaseProps, getLabelProps, getInputProps} =
    useCheckbox({
      ...props,
    });

  const styles = checkbox({isSelected, isFocusVisible});

  return (
    <label {...getBaseProps()}>
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <Chip
        classNames={{
          base: styles.base(),
          content: styles.content(),
        }}
        color="primary"
        startContent={isSelected ? <Check className="ml-1 h-4 w-4" /> : <X className="ml-1 h-4 w-4" />}
        variant="faded"
        {...getLabelProps()}
      >
        {children ? children : isSelected ? "Enabled" : "Disabled"}
      </Chip>
    </label>
  );
};

export default function CaseSettings() {
  const currentSet = useStore(AlgStore, state => state.currentSet);
  const selectedCases = useStore(AlgStore, state => state.selectedCases);
  const trainInverses = useStore(AlgStore, state => state.trainInverses);
  const chunkSize = useStore(AlgStore, state => state.chunkSize);

  const showMoves = useStore(MoveStore, state => state.showMoves);

  const algs = useStore(AlgStore, state => state.algs);
  const algsLoaded = algs.length > 0;

  const cases = [...new Set(algs.flatMap(alg => [alg.case.first, alg.case.second]))].sort();

  return (
    <div className='pt-4 flex flex-col gap-3'>
      <Select
        aria-label="Select the alg set"
        selectedKeys={[currentSet]}
        onChange={(change) => setCurrentSet(change.target.value as (typeof ALG_SETS)[number])} isRequired>
          {ALG_SETS.map((set) => (
          <SelectItem key={set}>
            {set}
          </SelectItem>
        ))}
      </Select>
      <Skeleton isLoaded={algsLoaded} className="rounded-large">
        <CheckboxGroup
          className="gap-1"
          label="Select cases"
          orientation="horizontal"
          value={selectedCases}
          onChange={(change) => AlgStore.setState((prev) => ({ ...prev, selectedCases: [...change] }))}
        >
          {cases.map((c) => (
            <CustomCheckbox key={c} value={c}>{c}</CustomCheckbox>
          ))}
        </CheckboxGroup>
      </Skeleton>
      <Skeleton isLoaded={algsLoaded} className="rounded-large">
        <ButtonGroup fullWidth>
          <Button variant="bordered" onPress={() => AlgStore.setState((prev) => ({ ...prev, selectedCases: [] }))}>
            Clear
          </Button>
          <Button variant="solid" onPress={() => AlgStore.setState((prev) => ({ ...prev, selectedCases: cases }))}>
            Select All
          </Button>
        </ButtonGroup>
      </Skeleton>
      <Checkbox isSelected={trainInverses} onValueChange={(checked) => AlgStore.setState((prev) => ({ ...prev, trainInverses: checked }))}>
        Train inverse cases
      </Checkbox>
      <Checkbox isSelected={showMoves} onValueChange={(checked) => MoveStore.setState((prev) => ({ ...prev, showMoves: checked }))}>
        Show current moves on cube
      </Checkbox>
      <NumberInput
        description="Number of cases to train at once"
        label="Chunk size"
        min={1}
        max={6}
        value={chunkSize}
        onValueChange={(value) => AlgStore.setState((prev) => ({ ...prev, chunkSize: Math.max(1, Math.min(6, value)) }))}
      />
    </div>
  );
}
