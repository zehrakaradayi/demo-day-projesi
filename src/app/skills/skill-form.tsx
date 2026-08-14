"use client";

import { useMemo, useState } from "react";
import { upsertUserSkillAction } from "./actions";
import { suggestSkillFields } from "@/lib/matching-education/skill-builder";
import { SKILL_LEVEL_LABELS, SKILL_MODE_LABELS, TEACHING_STYLE_LABELS, LEARNING_PURPOSE_LABELS } from "@/lib/matching-education/labels";
import { inputClass, buttonClass } from "@/lib/matching-education/ui";
import { SkillLevel, SkillMode, TeachingStyle, LearningPurpose } from "@/generated/prisma/enums";

type CatalogSkill = { id: string; name: string; category: string };

export function SkillForm({ catalog, asUserId }: { catalog: CatalogSkill[]; asUserId?: string }) {
  const [freeText, setFreeText] = useState("");
  const [mode, setMode] = useState<string>(SkillMode.TEACH);
  const [level, setLevel] = useState<string>(SkillLevel.INTERMEDIATE);
  const [teachingStyle, setTeachingStyle] = useState<string>("");
  const [useNewSkill, setUseNewSkill] = useState(catalog.length === 0);
  const [suggestion, setSuggestion] = useState<ReturnType<typeof suggestSkillFields> | null>(null);

  const categories = useMemo(() => [...new Set(catalog.map((s) => s.category))].sort(), [catalog]);

  function handleFreeTextChange(value: string) {
    setFreeText(value);
    if (value.trim().length < 4) {
      setSuggestion(null);
      return;
    }
    const result = suggestSkillFields(value);
    setSuggestion(result);
    setMode(result.mode);
    setLevel(result.level);
    if (result.teachingStyle) setTeachingStyle(result.teachingStyle);
  }

  return (
    <form action={upsertUserSkillAction} className="space-y-4">
      {asUserId ? <input type="hidden" name="asUserId" value={asUserId} /> : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Serbest metinle anlat (AI Skill Builder — MVP: kural tabanlı öneri)
        </label>
        <input
          type="text"
          value={freeText}
          onChange={(e) => handleFreeTextChange(e.target.value)}
          placeholder='ör. "Türev konusunda çok iyiyim, öğretebilirim"'
          className={inputClass}
        />
        {suggestion ? (
          <p className="mt-1 text-xs text-violet-600">
            Öneri: {SKILL_MODE_LABELS[suggestion.mode]} · {SKILL_LEVEL_LABELS[suggestion.level]}
            {suggestion.teachingStyle ? ` · ${TEACHING_STYLE_LABELS[suggestion.teachingStyle]}` : ""} — aşağıdaki
            alanları güncelledik, dilersen değiştir.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Skill</label>
          {!useNewSkill && catalog.length > 0 ? (
            <select name="skillId" className={inputClass} defaultValue="">
              <option value="" disabled>
                Seç…
              </option>
              {categories.map((category) => (
                <optgroup key={category} label={category}>
                  {catalog
                    .filter((s) => s.category === category)
                    .map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" name="newSkillName" placeholder="Yeni skill adı" className={inputClass} required={useNewSkill} />
              <input type="text" name="newSkillCategory" placeholder="Kategori" className={inputClass} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setUseNewSkill((v) => !v)}
            className="mt-1 text-xs font-medium text-violet-600 hover:underline"
          >
            {useNewSkill ? "Listeden seç" : "Listede yok, yeni ekle"}
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Yön</label>
          <select name="mode" className={inputClass} value={mode} onChange={(e) => setMode(e.target.value)}>
            {Object.values(SkillMode).map((value) => (
              <option key={value} value={value}>
                {SKILL_MODE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Seviye</label>
          <select name="level" className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)}>
            {Object.values(SkillLevel).map((value) => (
              <option key={value} value={value}>
                {SKILL_LEVEL_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Öğretme biçimi</label>
          <select
            name="teachingStyle"
            className={inputClass}
            value={teachingStyle}
            onChange={(e) => setTeachingStyle(e.target.value)}
          >
            <option value="">—</option>
            {Object.values(TeachingStyle).map((value) => (
              <option key={value} value={value}>
                {TEACHING_STYLE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Öğrenme amacı</label>
          <select name="learningPurpose" className={inputClass} defaultValue="">
            <option value="">—</option>
            {Object.values(LearningPurpose).map((value) => (
              <option key={value} value={value}>
                {LEARNING_PURPOSE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Deneyim (yıl)</label>
          <input type="number" name="experienceYears" min={0} max={60} className={inputClass} />
        </div>
      </div>

      <button type="submit" className={buttonClass}>
        Ekle / Güncelle
      </button>
    </form>
  );
}
