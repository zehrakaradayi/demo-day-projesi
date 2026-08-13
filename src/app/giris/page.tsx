"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function GirisPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Giriş Yap</h1>
        <p className="text-sm text-neutral-600">Hesabına giriş yap.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
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
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {pending ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </form>

      <p className="text-sm text-neutral-600">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium text-violet-600">
          Kayıt ol
        </Link>
      </p>
    </main>
  );
}
