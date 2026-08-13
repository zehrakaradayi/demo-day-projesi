"use client";

import { useActionState } from "react";
import type { AddSkillState } from "./actions";
import { SKILL_LEVEL_LABELS } from "@/lib/labels";

type SkillOption = { id: string; name: string; category: string };

type AddSkillFormProps = {
  action: (prevState: AddSkillState, formData: FormData) => Promise<AddSkillState>;
  skills: SkillOption[];
};

const initialState: AddSkillState = { error: null };

export function AddSkillForm({ action, skills }: AddSkillFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (skills.length === 0) {
    return <p className="text-xs text-neutral-500">Eklenecek yeni skill kalmadı.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <select
          name="skillId"
          required
          defaultValue=""
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          <option value="" disabled>
            Skill seç
          </option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name} ({skill.category})
            </option>
          ))}
        </select>
        <select
          name="level"
          defaultValue="BEGINNER"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          {Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-violet-300 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
        >
          {pending ? "Ekleniyor..." : "Ekle"}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
