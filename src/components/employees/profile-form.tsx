"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateOwnProfileAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm({
  firstName,
  lastName,
  phone,
}: {
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName, lastName, phone },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await updateOwnProfileAction({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
      });
      setMessage("Profile updated");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>First name</Label>
        <Input {...register("firstName")} />
        {errors.firstName && (
          <p className="text-xs text-red-600">{errors.firstName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Last name</Label>
        <Input {...register("lastName")} />
        {errors.lastName && (
          <p className="text-xs text-red-600">{errors.lastName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input {...register("phone")} />
      </div>
      {message && <p className="text-sm text-teal-700">{message}</p>}
      <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
