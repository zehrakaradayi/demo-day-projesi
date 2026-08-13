"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = { error: null };

export default function KayitPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kayıt Ol</h1>
        <p className="text-sm text-neutral-600">
          SkillSwap&apos;e katıl: bildiğini paylaş, yeni bir şey öğren.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Ad
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {pending ? "Kayıt olunuyor..." : "Kayıt ol"}
        </button>
      </form>

      <p className="text-sm text-neutral-600">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-violet-600">
          Giriş yap
        </Link>
      </p>
    </main>
  );
}
