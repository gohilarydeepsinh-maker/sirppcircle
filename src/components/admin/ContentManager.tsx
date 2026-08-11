import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSemesters, useSubjects, useTopics, useUnits } from "@/lib/data";
import { cn } from "@/lib/utils";

type TableName = "semesters" | "subjects" | "units" | "topics";
type Item = { id: string; name: string; display_order: number };

function useCrud(table: TableName, parentColumn: string | null, parentId: string | null) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries();

  const add = async (name: string, items: Item[]) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (parentColumn && !parentId) return false;
    const nextOrder = items.reduce((max, item) => Math.max(max, item.display_order), 0) + 1;
    const payload: Record<string, unknown> = { name: trimmed, display_order: nextOrder };
    if (parentColumn && parentId) payload[parentColumn] = parentId;
    const { error } = await supabase.from(table).insert(payload as never);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Added");
    await refresh();
    return true;
  };

  const rename = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const { error } = await supabase.from(table).update({ name: trimmed }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Saved");
    await refresh();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Delete blocked — remove the items inside it first.");
      return;
    }
    toast.success("Deleted");
    await refresh();
  };

  const move = async (items: Item[], index: number, direction: -1 | 1) => {
    const target = items[index + direction];
    const current = items[index];
    if (!target || !current) return;
    const results = await Promise.all([
      supabase.from(table).update({ display_order: target.display_order }).eq("id", current.id),
      supabase.from(table).update({ display_order: current.display_order }).eq("id", target.id),
    ]);
    if (results.some((r) => r.error)) {
      toast.error("Could not reorder.");
      return;
    }
    await refresh();
  };

  return { add, rename, remove, move };
}

function ManagerBlock({
  title,
  hint,
  placeholder,
  table,
  parentColumn,
  parentId,
  items,
  loading,
  selectedId,
  onSelect,
}: {
  title: string;
  hint: string;
  placeholder: string;
  table: TableName;
  parentColumn: string | null;
  parentId: string | null;
  items: Item[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const crud = useCrud(table, parentColumn, parentId);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const disabled = Boolean(parentColumn) && !parentId;

  return (
    <div className="surface-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-[0.68rem] text-muted-foreground">{hint}</span>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const ok = await crud.add(draft, items);
          if (ok) setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={disabled ? "Select the parent first" : placeholder}
          disabled={disabled}
          maxLength={120}
          className="min-w-0 flex-1 rounded-full border border-input bg-card px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
          aria-label={`Add ${title}`}
        >
          <Plus className="size-4" />
        </button>
      </form>

      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {disabled ? "Nothing to show yet." : "Nothing added yet."}
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border border-border/70 bg-background/60 px-3 py-2",
                selectedId === item.id && "border-primary/60 bg-primary/5",
              )}
            >
              {editingId === item.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editValue}
                    onChange={(event) => setEditValue(event.target.value)}
                    maxLength={120}
                    className="min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    aria-label="Save"
                    onClick={async () => {
                      const ok = await crud.rename(item.id, editValue);
                      if (ok) setEditingId(null);
                    }}
                    className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Cancel"
                    onClick={() => setEditingId(null)}
                    className="flex size-8 items-center justify-center rounded-full border border-input"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelect(selectedId === item.id ? null : item.id)}
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                  >
                    {item.name}
                  </button>
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => void crud.move(items, index, -1)}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => void crud.move(items, index, 1)}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Rename"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditValue(item.name);
                    }}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => void crud.remove(item.id)}
                    className="flex size-8 items-center justify-center rounded-full text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ContentManager() {
  const [semesterId, setSemesterId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);

  const semesters = useSemesters();
  const subjects = useSubjects(semesterId);
  const units = useUnits(unitParent(subjectId));
  const topics = useTopics(unitId);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Tap a row to open the level below it. Units and topics are typed in manually.
      </p>
      <ManagerBlock
        title="Semesters"
        hint="tap to open subjects"
        placeholder="e.g. Semester 1"
        table="semesters"
        parentColumn={null}
        parentId={null}
        items={(semesters.data ?? []) as Item[]}
        loading={semesters.isLoading}
        selectedId={semesterId}
        onSelect={(id) => {
          setSemesterId(id);
          setSubjectId(null);
          setUnitId(null);
        }}
      />
      <ManagerBlock
        title="Subjects"
        hint="tap to open units"
        placeholder="e.g. Data Structures"
        table="subjects"
        parentColumn="semester_id"
        parentId={semesterId}
        items={semesterId ? ((subjects.data ?? []) as Item[]) : []}
        loading={Boolean(semesterId) && subjects.isLoading}
        selectedId={subjectId}
        onSelect={(id) => {
          setSubjectId(id);
          setUnitId(null);
        }}
      />
      <ManagerBlock
        title="Units"
        hint="tap to open topics"
        placeholder="Type a unit name"
        table="units"
        parentColumn="subject_id"
        parentId={subjectId}
        items={subjectId ? ((units.data ?? []) as Item[]) : []}
        loading={Boolean(subjectId) && units.isLoading}
        selectedId={unitId}
        onSelect={setUnitId}
      />
      <ManagerBlock
        title="Topics"
        hint="documents attach here"
        placeholder="Type a topic name"
        table="topics"
        parentColumn="unit_id"
        parentId={unitId}
        items={unitId ? ((topics.data ?? []) as Item[]) : []}
        loading={Boolean(unitId) && topics.isLoading}
        selectedId={null}
        onSelect={() => {}}
      />
    </div>
  );
}

function unitParent(subjectId: string | null) {
  return subjectId ?? "__none__";
}
