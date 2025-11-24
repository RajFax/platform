// src/pages/ControllersPage.tsx
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchControllers,
  createController,
  updateController,
  deleteController,
  type ControllerItem,
  type ControllerPayload,
} from "../api/controllers";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function ControllersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ControllerItem[]>({
    queryKey: ["controllers"],
    queryFn: fetchControllers,
  });

  const [editing, setEditing] = useState<ControllerItem | null>(null);
  const [form, setForm] = useState<ControllerPayload>({
    zone_id: 0,
    name: "",
    type: "",
    level: "",
    mode: "AUTO",
    status: "OFFLINE",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idBeingDeleted, setIdBeingDeleted] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: ControllerPayload) => createController(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controllers"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la création du contrôleur.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: Partial<ControllerPayload> }) =>
      updateController(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controllers"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la mise à jour du contrôleur.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteController(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controllers"] });
      if (editing && editing.id === idBeingDeleted) {
        resetForm();
      }
    },
    onError: () => {
      setErrorMsg("Erreur lors de la suppression du contrôleur.");
    },
  });

  function resetForm() {
    setEditing(null);
    setForm({
      zone_id: 0,
      name: "",
      type: "",
      level: "",
      mode: "AUTO",
      status: "OFFLINE",
    });
    setErrorMsg(null);
    setIdBeingDeleted(null);
  }

  function handleEdit(ctrl: ControllerItem) {
    setEditing(ctrl);
    setForm({
      zone_id: ctrl.zone?.id ?? 0,
      name: ctrl.name,
      type: ctrl.type,
      level: ctrl.level ?? "",
      mode: ctrl.mode,
      status: ctrl.status,
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Supprimer ce contrôleur ?")) return;
    setIdBeingDeleted(id);
    deleteMutation.mutate(id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim() || !form.type.trim() || !form.mode.trim()) {
      setErrorMsg("Nom, type et mode sont obligatoires.");
      return;
    }

    if (!form.zone_id || isNaN(Number(form.zone_id))) {
      setErrorMsg("Zone ID est obligatoire (pour l'instant).");
      return;
    }

    const payload: ControllerPayload = {
      zone_id: Number(form.zone_id),
      name: form.name.trim(),
      type: form.type.trim(),
      level: form.level?.trim() || null,
      mode: form.mode.trim(),
      status: form.status || "OFFLINE",
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (isLoading) return <div>Chargement des contrôleurs…</div>;
  if (isError || !data) return <div>Erreur lors du chargement des contrôleurs.</div>;

  const controllers = data;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Contrôleurs</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Gestion des contrôleurs d'irrigation/fertigation, leur mode et leur rattachement à une zone.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr] gap-4">
        {/* LISTE */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-800">Liste des contrôleurs</div>
            <Button variant="primary" size="xs" type="button" onClick={resetForm}>
              + Nouveau contrôleur
            </Button>
          </div>

          {controllers.length === 0 ? (
            <div className="text-xs text-slate-500">Aucun contrôleur configuré.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2">Nom</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Mode</th>
                    <th className="text-left px-3 py-2">Statut</th>
                    <th className="text-left px-3 py-2">Zone</th>
                    <th className="text-left px-3 py-2">Parcelle</th>
                    <th className="text-left px-3 py-2">Exploitation</th>
                    <th className="text-left px-3 py-2">Dernière comm.</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {controllers.map((c) => (
                    <ControllerRow
                      key={c.id}
                      ctrl={c}
                      onEdit={() => handleEdit(c)}
                      onDelete={() => handleDelete(c.id)}
                      deleting={deleteMutation.isPending && idBeingDeleted === c.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* FORMULAIRE */}
        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-800">
            {editing ? `Modifier : ${editing.name}` : "Nouveau contrôleur"}
          </div>

          {errorMsg && <div className="mb-3 text-xs text-red-600">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Zone ID *</label>
                <input
                  type="number"
                  className="w-full"
                  value={form.zone_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, zone_id: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Nom *</label>
                <input
                  className="w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Type *</label>
                <input
                  className="w-full"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Niveau</label>
                <input
                  className="w-full"
                  value={form.level ?? ""}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Mode *</label>
                <select
                  className="w-full"
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                >
                  <option value="AUTO">AUTO</option>
                  <option value="MANUAL">MANUAL</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Statut *</label>
                <select
                  className="w-full"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editing && (
                <Button type="button" variant="ghost" size="xs" onClick={resetForm}>
                  Annuler
                </Button>
              )}
              <Button
                variant="primary"
                size="xs"
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editing ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

type ControllerRowProps = {
  ctrl: ControllerItem;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
};

function ControllerRow({ ctrl, onEdit, onDelete, deleting }: ControllerRowProps) {
  const statusColor =
    ctrl.status === "ONLINE"
      ? "text-emerald-700"
      : ctrl.status === "ERROR"
      ? "text-red-600"
      : "text-amber-700";

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 text-slate-800">
      <td className="px-3 py-2">{ctrl.name}</td>
      <td className="px-3 py-2">{ctrl.type}</td>
      <td className="px-3 py-2">{ctrl.mode}</td>
      <td className={`px-3 py-2 ${statusColor}`}>{ctrl.status}</td>
      <td className="px-3 py-2">
        {ctrl.zone ? (
          <Link
            to={`/zones/${ctrl.zone.id}`}
            className="underline decoration-slate-300 hover:text-slate-900"
          >
            {ctrl.zone.name}
          </Link>
        ) : (
          <span className="text-slate-500">—</span>
        )}
      </td>
      <td className="px-3 py-2">{ctrl.zone?.parcel?.name ?? "—"}</td>
      <td className="px-3 py-2">{ctrl.zone?.farm?.name ?? "—"}</td>
      <td className="px-3 py-2 text-slate-500">{ctrl.last_seen_at ?? "—"}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button size="xs" variant="secondary" onClick={onEdit}>
            Éditer
          </Button>
          <Button
            size="xs"
            variant="danger"
            onClick={() => {
              if (confirm("Supprimer ce contrôleur ?")) onDelete();
            }}
            disabled={deleting}
          >
            Suppr
          </Button>
        </div>
      </td>
    </tr>
  );
}
