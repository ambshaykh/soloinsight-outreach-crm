"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Fingerprint, Loader2, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { markPasskeyEnrolled } from "@/app/actions/auth";
import { formatDateTime } from "@/lib/utils";

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function refresh() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.passkey.list();
    if (error) { toast.error(error.message); return; }
    setPasskeys(data ?? []);
  }

  useEffect(() => { refresh(); }, []);

  async function handleRegister() {
    setBusy("register");
    const supabase = createClient();
    const { error } = await supabase.auth.registerPasskey();
    setBusy(null);
    if (error) { toast.error(error.message || "Couldn't register a passkey."); return; }
    await markPasskeyEnrolled();
    toast.success("Passkey added");
    refresh();
  }

  async function handleDelete(id: string) {
    setBusy(id);
    const supabase = createClient();
    const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Passkey removed");
    refresh();
  }

  async function handleRename(id: string) {
    setBusy(id);
    const supabase = createClient();
    const { error } = await supabase.auth.passkey.update({ passkeyId: id, friendlyName: renameValue });
    setBusy(null);
    setRenamingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Renamed");
    refresh();
  }

  if (passkeys === null) {
    return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-3">
      {passkeys.length === 0 ? (
        <p className="text-xs text-[#6B7280]">No passkeys registered yet.</p>
      ) : (
        <ul className="space-y-2">
          {passkeys.map((pk) => (
            <li key={pk.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Fingerprint className="h-4 w-4 text-primary" />
                {renamingId === pk.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="h-7 w-40 text-xs"
                      autoFocus
                    />
                    <button onClick={() => handleRename(pk.id)} className="text-emerald-600 hover:text-emerald-700"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setRenamingId(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-[#0F1419]">{pk.friendly_name || "Passkey"}</p>
                    <p className="text-[10px] text-[#8B95A5]">
                      Added {formatDateTime(pk.created_at)}
                      {pk.last_used_at && ` · last used ${formatDateTime(pk.last_used_at)}`}
                    </p>
                  </div>
                )}
              </div>
              {renamingId !== pk.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setRenamingId(pk.id); setRenameValue(pk.friendly_name ?? ""); }}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(pk.id)}
                    disabled={busy === pk.id}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    {busy === pk.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" size="sm" onClick={handleRegister} disabled={busy === "register"}>
        {busy === "register" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        Add a passkey
      </Button>
    </div>
  );
}
