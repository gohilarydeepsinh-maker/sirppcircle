import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Semester = Database["public"]["Tables"]["semesters"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Unit = Database["public"]["Tables"]["units"]["Row"];
export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocStatus = Database["public"]["Enums"]["doc_status"];

const DOC_SELECT =
  "*, semesters(name), subjects(name), units(name), topics(name), profiles!documents_uploaded_by_fkey(name,email)";

export type DocumentWithNames = DocumentRow & {
  semesters: { name: string } | null;
  subjects: { name: string } | null;
  units: { name: string } | null;
  topics: { name: string } | null;
  profiles: { name: string | null; email: string | null } | null;
};

const CATEGORY_EXTENSIONS: Record<string, string[]> = {
  pdf: ["pdf"],
  image: ["jpg", "jpeg", "png", "webp", "gif"],
  doc: ["doc", "docx"],
  xls: ["xls", "xlsx"],
  ppt: ["ppt", "pptx"],
  txt: ["txt"],
  csv: ["csv"],
  zip: ["zip"],
};

export type DocFilters = {
  semesterId?: string | null | undefined;
  subjectId?: string | null | undefined;
  unitId?: string | null | undefined;
  topicId?: string | null | undefined;
  docType?: string | null | undefined;
  recentOnly?: boolean | undefined;
  status?: DocStatus | "all" | undefined;
  limit?: number | undefined;
};

export function useSemesters() {
  return useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("semesters")
        .select("*")
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useSubjects(semesterId?: string | null) {
  return useQuery({
    queryKey: ["subjects", semesterId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("subjects").select("*").order("display_order").order("name");
      if (semesterId) query = query.eq("semester_id", semesterId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUnits(subjectId?: string | null) {
  return useQuery({
    queryKey: ["units", subjectId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("units").select("*").order("display_order").order("name");
      if (subjectId) query = query.eq("subject_id", subjectId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useTopics(unitId?: string | null) {
  return useQuery({
    queryKey: ["topics", unitId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("topics").select("*").order("display_order").order("name");
      if (unitId) query = query.eq("unit_id", unitId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useDocuments(filters: DocFilters = {}) {
  const {
    semesterId,
    subjectId,
    unitId,
    topicId,
    docType,
    recentOnly,
    status = "approved",
    limit = 60,
  } = filters;

  return useQuery({
    queryKey: [
      "documents",
      { semesterId, subjectId, unitId, topicId, docType, recentOnly, status, limit },
    ],
    queryFn: async () => {
      let query = supabase.from("documents").select(DOC_SELECT);
      if (status !== "all") query = query.eq("status", status);
      if (semesterId) query = query.eq("semester_id", semesterId);
      if (subjectId) query = query.eq("subject_id", subjectId);
      if (unitId) query = query.eq("unit_id", unitId);
      if (topicId) query = query.eq("topic_id", topicId);
      if (docType && CATEGORY_EXTENSIONS[docType]) {
        query = query.in("file_type", CATEGORY_EXTENSIONS[docType]);
      }
      if (recentOnly) {
        const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", since);
      }
      const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data as unknown as DocumentWithNames[];
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(DOC_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as DocumentWithNames) ?? null;
    },
  });
}

export function useMyUploads(userId?: string | null) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["my-uploads", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(DOC_SELECT)
        .eq("uploaded_by", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as DocumentWithNames[];
    },
  });
}

export function useProfiles(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useActivityLogs(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ["activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*, profiles(name,email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as (Database["public"]["Tables"]["activity_logs"]["Row"] & {
        profiles: { name: string | null; email: string | null } | null;
      })[];
    },
  });
}

export function useStats(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ["stats"],
    queryFn: async () => {


      const [
        students,
        captains,
        admins,
        semesters,
        subjects,
        units,
        topics,
        documents,
        pending,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "captain"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("semesters").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("units").select("id", { count: "exact", head: true }),
        supabase.from("topics").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      return {
        students: students.count ?? 0,
        captains: captains.count ?? 0,
        admins: admins.count ?? 0,
        semesters: semesters.count ?? 0,
        subjects: subjects.count ?? 0,
        units: units.count ?? 0,
        topics: topics.count ?? 0,
        documents: documents.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });
}

/** Invalidate every data query — used after admin mutations. */
export function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export { useMutation };
