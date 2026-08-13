"use client";

import { useState } from "react";
import { upsertUserCourseTopicAction } from "./actions";
import { SKILL_LEVEL_LABELS, SKILL_MODE_LABELS } from "@/lib/matching-education/labels";
import { inputClass, buttonClass } from "@/lib/matching-education/ui";
import { SkillLevel, SkillMode } from "@/generated/prisma/enums";

type Course = { id: string; name: string; topics: { id: string; name: string; level: string | null }[] };

export function TopicForm({ courses, asUserId }: { courses: Course[]; asUserId?: string }) {
  const [useNewTopic, setUseNewTopic] = useState(false);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <form action={upsertUserCourseTopicAction} className="space-y-4">
      {asUserId ? <input type="hidden" name="asUserId" value={asUserId} /> : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Ders</label>
        <select
          className={inputClass}
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Konu</label>
        {!useNewTopic && selectedCourse && selectedCourse.topics.length > 0 ? (
          <select name="topicId" className={inputClass} defaultValue="">
            <option value="" disabled>
              Seç…
            </option>
            {selectedCourse.topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name} {topic.level ? `(${topic.level})` : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex gap-2">
            <input type="hidden" name="newTopicCourseId" value={courseId} />
            <input type="text" name="newTopicName" placeholder="Yeni konu (ör. Türev)" className={inputClass} required={useNewTopic} />
            <input type="text" name="newTopicLevel" placeholder="Seviye (ör. Lise)" className={inputClass} required={useNewTopic} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setUseNewTopic((v) => !v)}
          className="mt-1 text-xs font-medium text-violet-600 hover:underline"
        >
          {useNewTopic ? "Listeden seç" : "Listede yok, yeni ekle"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Yön</label>
          <select name="mode" className={inputClass} defaultValue={SkillMode.TEACH}>
            {Object.values(SkillMode).map((value) => (
              <option key={value} value={value}>
                {SKILL_MODE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Seviye</label>
          <select name="level" className={inputClass} defaultValue={SkillLevel.INTERMEDIATE}>
            {Object.values(SkillLevel).map((value) => (
              <option key={value} value={value}>
                {SKILL_LEVEL_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className={buttonClass}>
        Ekle / Güncelle
      </button>
    </form>
  );
}
