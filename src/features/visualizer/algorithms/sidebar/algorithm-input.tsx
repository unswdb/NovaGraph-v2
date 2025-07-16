import { Label } from "~/components/form/label";
import { INPUT_COMPONENTS, type AlgorithmInputComponentProps } from "../inputs";

export default function AlgorithmInput({
  input,
  nodes,
  edges,
  value,
  onChange,
}: AlgorithmInputComponentProps) {
  const InputComponent = INPUT_COMPONENTS[input.type];

  if (!InputComponent) {
    console.warn(`Unknown input type: ${input.type}`);
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>{input.label}</Label>
      <InputComponent
        input={input}
        nodes={nodes}
        edges={edges}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
