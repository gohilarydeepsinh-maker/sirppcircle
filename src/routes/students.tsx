import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { AppShell, Protected } from "@/components/AppShell";
import { UserAvatar } from "@/components/AppLogo";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useSemesters, useStudentDirectory, useSubjects } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/students")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student directory — Campus Notes" },
      {
        name: "description",
        content: "Find classmates by name, roll number, semester or major subject.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Student directory — Campus Notes" },
      { property: "og:description", content: "Browse the college student directory." },
    ],
  }),
  component: () => (
    <Protected>
      <StudentsPage />
    </Protected>
  ),
});

type Sort = "name" | "roll";

function StudentsPage() {
  const directory = useStudentDirectory();
  const semesters = useSemesters();
  const [query, setQuery] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const subjects = useSubjects(semesterId || null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (directory.data ?? []).filter((student) => {
      if (semesterId && student.semester_id !== semesterId) return false;
      if (subjectId && student.subject_id !== subjectId) return false;
      if (!needle) return true;
      return (
        (student.name ?? "").toLowerCase().includes(needle) ||
        (student.roll_number ?? "").toLowerCase().includes(needle) ||
        (student.subject ?? "").toLowerCase().includes(needle)
      );
    });
    return [...list].sort((a, b) =>
      sort === "roll"
        ? (a.roll_number ?? "").localeCompare(b.roll_number ?? "", undefined, { numeric: true })
        : (a.name ?? "").localeCompare(b.name ?? ""),
    );
  }, [directory.data, query, semesterId, subjectId, sort]);

  return (
    <AppShell title="Student directory" subtitle={`${rows.length} member${rows.length === 1 ? "" : "s"}`}>
      <div className="surface-card p-3.5">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, roll number or subject"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select
            value={semesterId}
            onChange={(event) => {
              setSemesterId(event.target.value);
              setSubjectId("");
            }}
            className="input-field"
          >
            <option value="">All semesters</option>
            {(semesters.data ?? []).map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            disabled={!semesterId}
            className="input-field disabled:opacity-60"
          >
            <option value="">All subjects</option>
            {(subjects.data ?? []).map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          {(["name", "roll"] as Sort[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSort(option)}
              className={cn(
                "press rounded-full px-3.5 py-1.5 text-xs font-semibold",
                sort === option
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-card text-muted-foreground",
              )}
            >
              {option === "name" ? "Sort by name" : "Sort by roll no."}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {directory.isLoading ? (
          <ListSkeleton rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No students found"
            message="Students appear here once they finish setting up their profile."
          />
        ) : (
          rows.map((student) => (
            <article key={student.id} className="surface-card flex items-center gap-3 p-3.5">
              <UserAvatar name={student.name} url={student.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{student.name ?? "Student"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {student.roll_number ? `Roll ${student.roll_number}` : "Roll —"}
                  {student.subject ? ` · ${student.subject}` : ""}
                </p>
              </div>
              {student.role !== "student" ? (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-accent-foreground">
                  {student.role}
                </span>
              ) : (
                <Users className="size-4 text-muted-foreground" />
              )}
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
