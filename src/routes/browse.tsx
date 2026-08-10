import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FolderOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Protected } from "@/components/AppShell";
import { DocumentCard } from "@/components/DocumentCard";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { DOC_TYPE_OPTIONS } from "@/lib/files";
import { useDocuments, useSemesters, useSubjects, useTopics, useUnits } from "@/lib/data";
import { cn } from "@/lib/utils";

type BrowseSearch = {
  semester?: string | undefined;
  subject?: string | undefined;
  unit?: string | undefined;
  topic?: string | undefined;
  type?: string | undefined;
};


export const Route = createFileRoute("/browse")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    semester: typeof search["semester"] === "string" ? search["semester"] : undefined,
    subject: typeof search["subject"] === "string" ? search["subject"] : undefined,
    unit: typeof search["unit"] === "string" ? search["unit"] : undefined,
    topic: typeof search["topic"] === "string" ? search["topic"] : undefined,
    type: typeof search["type"] === "string" ? search["type"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse study material — Campus Notes" },
      {
        name: "description",
        content: "Drill down from semester to subject, unit and topic to find the notes you need.",
      },
      { property: "og:title", content: "Browse study material — Campus Notes" },
      { property: "og:description", content: "Semester, subject, unit and topic wise notes." },
    ],
  }),
  component: () => (
    <Protected>
      <BrowsePage />
    </Protected>
  ),
});

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [query, setQuery] = useState("");

  const semesters = useSemesters();
  const subjects = useSubjects(search.semester);
  const units = useUnits(search.subject);
  const topics = useTopics(search.unit);
  const documents = useDocuments({
    semesterId: search.semester,
    subjectId: search.subject,
    unitId: search.unit,
    topicId: search.topic,
    docType: search.type,
    limit: 100,
  });

  const setSearch = (next: BrowseSearch) => void navigate({ search: next });

  const level = search.topic
    ? "documents"
    : search.unit
      ? "topics"
      : search.subject
        ? "units"
        : search.semester
          ? "subjects"
          : "semesters";

  const semesterName = semesters.data?.find((s) => s.id === search.semester)?.name;
  const subjectName = subjects.data?.find((s) => s.id === search.subject)?.name;
  const unitName = units.data?.find((s) => s.id === search.unit)?.name;
  const topicName = topics.data?.find((s) => s.id === search.topic)?.name;

  const crumbs = [semesterName, subjectName, unitName, topicName].filter(Boolean) as string[];

  const filteredDocs = useMemo(() => {
    const list = documents.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        (doc.description ?? "").toLowerCase().includes(q) ||
        (doc.topics?.name ?? "").toLowerCase().includes(q),
    );
  }, [documents.data, query]);

  const back = () => {
    if (search.topic) setSearch({ ...search, topic: undefined });
    else if (search.unit) setSearch({ semester: search.semester, subject: search.subject, type: search.type });
    else if (search.subject) setSearch({ semester: search.semester, type: search.type });
    else if (search.semester) setSearch({ type: search.type });
  };

  return (
    <AppShell
      title={crumbs.at(-1) ?? "Browse"}
      subtitle={crumbs.length ? crumbs.slice(0, -1).join(" · ") || "Study material" : "Pick a semester"}
      {...(search.semester ? { onBack: back } : {})}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes by title or topic"
          maxLength={80}
          className="w-full rounded-full border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ value: "", label: "All types" }, ...DOC_TYPE_OPTIONS].map((option) => {
          const active = (search.type ?? "") === option.value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => setSearch({ ...search, type: option.value || undefined })}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {level === "semesters" ? (
          <NodeList
            loading={semesters.isLoading}
            items={semesters.data ?? []}
            emptyTitle="No semesters yet"
            onSelect={(id) => setSearch({ ...search, semester: id })}
          />
        ) : level === "subjects" ? (
          <NodeList
            loading={subjects.isLoading}
            items={subjects.data ?? []}
            emptyTitle="No subjects in this semester yet"
            onSelect={(id) => setSearch({ ...search, subject: id })}
          />
        ) : level === "units" ? (
          <NodeList
            loading={units.isLoading}
            items={units.data ?? []}
            emptyTitle="No units in this subject yet"
            onSelect={(id) => setSearch({ ...search, unit: id })}
          />
        ) : level === "topics" ? (
          <NodeList
            loading={topics.isLoading}
            items={topics.data ?? []}
            emptyTitle="No topics in this unit yet"
            onSelect={(id) => setSearch({ ...search, topic: id })}
          />
        ) : documents.isLoading ? (
          <ListSkeleton />
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            title="No documents here yet"
            message="Nothing has been approved for this topic so far."
          />
        ) : (
          filteredDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
        )}
      </div>

      {level !== "documents" && (documents.data ?? []).length > 0 ? (
        <section className="mt-8">
          <h3 className="section-title">Documents in this section</h3>
          <div className="mt-3 space-y-3">
            {filteredDocs.slice(0, 20).map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function NodeList({
  loading,
  items,
  emptyTitle,
  onSelect,
}: {
  loading: boolean;
  items: { id: string; name: string }[];
  emptyTitle: string;
  onSelect: (id: string) => void;
}) {
  if (loading) return <ListSkeleton rows={5} />;
  if (items.length === 0)
    return (
      <EmptyState
        title={emptyTitle}
        message="An admin will add this soon."
        icon={<FolderOpen className="size-6" />}
        action={
          <Link to="/home" className="text-xs font-semibold text-primary">
            Back to Home
          </Link>
        }
      />
    );

  return (
    <>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className="surface-card flex w-full items-center gap-3 p-4 text-left transition-transform active:scale-[0.99]"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <FolderOpen className="size-5" />
          </span>
          <span className="flex-1 truncate text-sm font-semibold">{item.name}</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      ))}
    </>
  );
}
