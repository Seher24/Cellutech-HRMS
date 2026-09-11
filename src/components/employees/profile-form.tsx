"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOwnProfileAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await updateOwnProfileAction({
            firstName: String(fd.get("firstName")),
            lastName: String(fd.get("lastName")),
            phone: String(fd.get("phone") || "") || undefined,
          });
          setMessage("Profile updated");
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label>First name</Label>
        <Input name="firstName" defaultValue={firstName} required />
      </div>
      <div className="space-y-2">
        <Label>Last name</Label>
        <Input name="lastName" defaultValue={lastName} required />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input name="phone" defaultValue={phone} />
      </div>
      {message && <p className="text-sm text-teal-700">{message}</p>}
      <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
