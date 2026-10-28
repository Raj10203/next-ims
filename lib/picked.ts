import "server-only";
import { userFetch } from "@/lib/auth";
import {
  pickerSources,
  toPickerOption,
  type PickerKind,
  type PickerOption,
  type PickerRecord,
} from "@/lib/pickers";

// The option a picker opens with when the URL or a link names an id: a filter
// such as ?productId= no longer has every record in its list to label it.
export async function pickedOption<K extends PickerKind>(
  kind: K,
  id: string | undefined,
): Promise<PickerOption<K> | null> {
  if (!id) return null;
  const result = await userFetch<PickerRecord<K>>(
    `${pickerSources[kind].path}/${id}`,
  );
  return result.ok
    ? toPickerOption(kind, result.data)
    : { id: Number(id), label: `#${id}` };
}
