"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

const EMAIL_DOMAIN = "cellutechfzco.com";

const schema = z.object({
  localPart: z
    .string()
    .min(1, "Enter your email initials or username")
    .regex(/^[a-zA-Z0-9._+-]+$/, "Use letters, numbers, dots, or underscores"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

function toWorkEmail(localPart: string) {
  return `${localPart.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { localPart: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("email", toWorkEmail(values.localPart));
    formData.set("password", values.password);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="localPart">Work email</Label>
        <div className="flex h-9 overflow-hidden rounded-lg border border-input bg-white focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <Input
            id="localPart"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="seher.siddique"
            className="h-full rounded-none border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0"
            {...register("localPart", {
              setValueAs: (value: string) =>
                value.replace(/@.*$/, "").trim().toLowerCase(),
            })}
          />
          <span className="flex shrink-0 items-center border-l border-input bg-slate-50 px-3 text-sm text-slate-600">
            @{EMAIL_DOMAIN}
          </span>
        </div>
        {errors.localPart && (
          <p className="text-xs text-red-600">{errors.localPart.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          placeholder="********"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full bg-teal-700 hover:bg-teal-800"
        disabled={pending}
      >
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
