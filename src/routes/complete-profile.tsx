import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { FullScreenLoader } from "@/components/AppShell";
import { UserAvatar } from "@/components/AppLogo";
import { useSemesters, useSubjects } from "@/lib/data";
import { uploadAvatar, validateImage } from "@/lib/assets";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/complete-profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Complete your profile — Campus Notes" },
      {
        name: "description",
        content: "Add your name, photo, roll number, semester and major subject to get started.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Complete your profile — Campus Notes" },
      {
        property: "og:description",
        content: "Set up your student profile to join the college study space.",
      },
    ],
  }),
  component: CompleteProfile,
});

function CompleteProfile() {
  const { loading, session, profile, profileComplete, refreshProfile } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [photoRef, setPhotoRef] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const semesters = useSemesters();
  const subjects = useSubjects(semesterId || null);

  useEffect(() => {
    if (loading) return;
    if (!session) void navigate({ to: "/", replace: true });
    else if (profileComplete) void navigate({ to: "/home", replace: true });
  }, [loading, session, profileComplete, navigate]);

  useEffect(() => {
    if (!profile) return;
    setName((current) => current || profile.name || "");
    setRoll((current) => current || profile.roll_number || "");
    setSemesterId((current) => current || profile.semester_id || "");
    setSubjectId((current) => current || profile.subject_id || "");
    setPhotoRef((current) => current ?? profile.avatar_url ?? null);
  }, [profile]);

  if (loading || !profile) return <FullScreenLoader />;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateImage(file, 4);
    if (problem) {
      toast.error(problem);
      return;
    }
    setUploading(true);
    try {
      const ref = await uploadAvatar(profile.id, file);
      setPhotoRef(ref);
      toast.success("Photo added");
    } catch (error) {
      console.error(error);
      toast.error("Could not upload the photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedRoll = roll.trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      toast.error("Please enter your full name (2–80 characters).");
      return;
    }
    if (trimmedRoll.length < 1 || trimmedRoll.length > 30) {
      toast.error("Please enter a valid roll number.");
      return;
    }
    if (!semesterId) {
      toast.error("Please select your semester.");
      return;
    }
    if (!subjectId) {
      toast.error("Please select your major subject.");
      return;
    }
    const subjectName = (subjects.data ?? []).find((item) => item.id === subjectId)?.name ?? null;

    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: trimmedName,
        roll_number: trimmedRoll,
        semester_id: semesterId,
        subject_id: subjectId,
        subject: subjectName,
        avatar_url: photoRef,
        profile_completed: true,
      })
      .eq("id", profile.id);
    if (error) {
      console.error(error);
      toast.error("Could not save your details. Please try again.");
      setBusy(false);
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
    void navigate({ to: "/home", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <form onSubmit={submit} className="surface-card w-full max-w-sm animate-fade-up p-6">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <UserRound className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-bold">Complete your profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This is how classmates will find you in the {settings.appName} directory.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <UserAvatar name={name || profile.name} url={photoRef} className="size-16 rounded-2xl" />
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="press inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-xs font-semibold disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {photoRef ? "Change photo" : "Add photo"}
            </button>
            <p className="mt-1.5 text-[0.7rem] text-muted-foreground">PNG or JPG, up to 4MB.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => void pickPhoto(event.target.files?.[0])}
          />
        </div>

        <Field label="Full name">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={80}
            placeholder="Enter your full name"
            className="input-field"
          />
        </Field>

        <Field label="Roll number">
          <input
            value={roll}
            onChange={(event) => setRoll(event.target.value)}
            required
            maxLength={30}
            placeholder="Enter your roll number"
            className="input-field"
          />
        </Field>

        <Field label="Semester">
          <select
            value={semesterId}
            onChange={(event) => {
              setSemesterId(event.target.value);
              setSubjectId("");
            }}
            required
            className="input-field"
          >
            <option value="">Select semester</option>
            {(semesters.data ?? []).map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Major subject">
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            required
            disabled={!semesterId}
            className="input-field disabled:opacity-60"
          >
            <option value="">{semesterId ? "Select subject" : "Choose a semester first"}</option>
            {(subjects.data ?? []).map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          disabled={busy || uploading}
          className="press mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Saving" : "Continue"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
