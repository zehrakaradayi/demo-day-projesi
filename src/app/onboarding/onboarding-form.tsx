"use client";

import { useActionState, useRef, useState } from "react";
import { submitOnboarding, type OnboardingState } from "./actions";
import {
  AGE_RANGE_OPTIONS,
  AVAILABILITY_SLOTS,
  GENDER_LABELS,
  MATCH_MODE_PREFERENCE_LABELS,
  MEETING_PREFERENCE_LABELS,
  SOCIAL_ENERGY_LABELS,
  YEAR_STATUS_LABELS,
} from "@/lib/labels";

type Department = { id: string; name: string };
type School = { id: string; name: string; departments: Department[] };

type OnboardingFormProps = {
  schools: School[];
  defaultCity: string;
  defaultCountry: string;
  defaultAgeRange: string;
  defaultGender: string;
  defaultLanguages: string;
  defaultInterests: string;
  defaultSocialEnergy: string;
  defaultMeetingPreference: string;
  defaultAvailabilitySlots: string[];
  defaultMatchModePreference: string;
  defaultCareerGoals: string;
  defaultDepartmentId: string;
  defaultYearStatus: string;
};

const initialState: OnboardingState = { error: null };

const STEP_TITLES = [
  "Temel bilgiler",
  "Şehir & ülke",
  "Diller",
  "İlgi alanları",
  "Sosyal enerji",
  "Buluşma tercihi",
  "Müsaitlik",
  "Eşleşme tercihi",
  "Okul, bölüm & kariyer hedefi",
];

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none";

function Step({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={active ? "flex flex-col gap-4" : "hidden"}>{children}</div>
  );
}

export function OnboardingForm({
  schools,
  defaultCity,
  defaultCountry,
  defaultAgeRange,
  defaultGender,
  defaultLanguages,
  defaultInterests,
  defaultSocialEnergy,
  defaultMeetingPreference,
  defaultAvailabilitySlots,
  defaultMatchModePreference,
  defaultCareerGoals,
  defaultDepartmentId,
  defaultYearStatus,
}: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(
    submitOnboarding,
    initialState,
  );

  const [step, setStep] = useState(0);
  const [cityError, setCityError] = useState(false);
  const cityRef = useRef<HTMLInputElement>(null);
  const lastStep = STEP_TITLES.length - 1;

  function goNext() {
    if (step === 1 && !cityRef.current?.value.trim()) {
      setCityError(true);
      return;
    }
    setCityError(false);
    setStep((s) => Math.min(s + 1, lastStep));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-full rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-violet-600"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500">
          Adım {step + 1} / {STEP_TITLES.length} · {STEP_TITLES[step]}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 p-5">
        <Step active={step === 0}>
          <div className="flex flex-col gap-1">
            <label htmlFor="ageRange" className="text-sm font-medium">
              Yaş aralığı
            </label>
            <select
              id="ageRange"
              name="ageRange"
              defaultValue={defaultAgeRange || AGE_RANGE_OPTIONS[1]}
              className={inputClass}
            >
              {AGE_RANGE_OPTIONS.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="gender" className="text-sm font-medium">
              Cinsiyet
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={defaultGender || "PREFER_NOT_TO_SAY"}
              className={inputClass}
            >
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </Step>

        <Step active={step === 1}>
          <div className="flex flex-col gap-1">
            <label htmlFor="city" className="text-sm font-medium">
              Şehir
            </label>
            <input
              ref={cityRef}
              id="city"
              name="city"
              type="text"
              required
              defaultValue={defaultCity}
              className={inputClass}
            />
            {cityError && (
              <p className="text-xs text-red-600">Şehir gerekli.</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="country" className="text-sm font-medium">
              Ülke
            </label>
            <input
              id="country"
              name="country"
              type="text"
              defaultValue={defaultCountry || "Türkiye"}
              className={inputClass}
            />
          </div>
        </Step>

        <Step active={step === 2}>
          <div className="flex flex-col gap-1">
            <label htmlFor="languages" className="text-sm font-medium">
              Diller
            </label>
            <input
              id="languages"
              name="languages"
              type="text"
              placeholder="ör. Türkçe, İngilizce"
              defaultValue={defaultLanguages}
              className={inputClass}
            />
            <p className="text-xs text-neutral-500">Virgülle ayırarak yaz.</p>
          </div>
        </Step>

        <Step active={step === 3}>
          <div className="flex flex-col gap-1">
            <label htmlFor="interests" className="text-sm font-medium">
              İlgi alanların
            </label>
            <input
              id="interests"
              name="interests"
              type="text"
              placeholder="ör. fotoğrafçılık, satranç, koşu"
              defaultValue={defaultInterests}
              className={inputClass}
            />
            <p className="text-xs text-neutral-500">Virgülle ayırarak yaz.</p>
          </div>
        </Step>

        <Step active={step === 4}>
          <div className="flex flex-col gap-1">
            <label htmlFor="socialEnergy" className="text-sm font-medium">
              Sosyal enerjin nasıl?
            </label>
            <select
              id="socialEnergy"
              name="socialEnergy"
              defaultValue={defaultSocialEnergy || "MEDIUM"}
              className={inputClass}
            >
              {Object.entries(SOCIAL_ENERGY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </Step>

        <Step active={step === 5}>
          <div className="flex flex-col gap-1">
            <label htmlFor="meetingPreference" className="text-sm font-medium">
              Online mı yüz yüze mi?
            </label>
            <select
              id="meetingPreference"
              name="meetingPreference"
              defaultValue={defaultMeetingPreference || "BOTH"}
              className={inputClass}
            >
              {Object.entries(MEETING_PREFERENCE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
        </Step>

        <Step active={step === 6}>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Müsaitlik</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AVAILABILITY_SLOTS.map((slot) => (
                <label key={slot} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="availabilitySlots"
                    value={slot}
                    defaultChecked={defaultAvailabilitySlots.includes(slot)}
                  />
                  {slot}
                </label>
              ))}
            </div>
          </div>
        </Step>

        <Step active={step === 7}>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="matchModePreference"
              className="text-sm font-medium"
            >
              Nasıl biriyle eşleşmek istersin?
            </label>
            <select
              id="matchModePreference"
              name="matchModePreference"
              defaultValue={defaultMatchModePreference || "NO_PREFERENCE"}
              className={inputClass}
            >
              {Object.entries(MATCH_MODE_PREFERENCE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
        </Step>

        <Step active={step === 8}>
          <div className="flex flex-col gap-1">
            <label htmlFor="departmentId" className="text-sm font-medium">
              Okul & bölüm
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                id="departmentId"
                name="departmentId"
                required
                defaultValue={defaultDepartmentId}
                className={`flex-1 ${inputClass}`}
              >
                <option value="" disabled>
                  Bölüm seç
                </option>
                {schools.map((school) => (
                  <optgroup key={school.id} label={school.name}>
                    {school.departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                name="yearStatus"
                defaultValue={defaultYearStatus || "YEAR_1"}
                className={inputClass}
              >
                {Object.entries(YEAR_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="careerGoals" className="text-sm font-medium">
              Kariyer/okul hedefin (opsiyonel)
            </label>
            <textarea
              id="careerGoals"
              name="careerGoals"
              rows={3}
              placeholder="ör. Mezun olunca backend geliştirici olarak çalışmak istiyorum."
              defaultValue={defaultCareerGoals}
              className={inputClass}
            />
          </div>
        </Step>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          Geri
        </button>

        {step < lastStep ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            İleri
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            {pending ? "Kaydediliyor..." : "Kaydet ve bitir"}
          </button>
        )}
      </div>
    </form>
  );
}
