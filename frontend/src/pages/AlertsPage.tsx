import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAlerts, updateAlert, deleteAlert } from "../api/alerts";
import type { AlertItem } from "../api/alerts";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function AlertsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<AlertItem[]>({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
  });

  const ackMutation = useMutation({
    mutationFn: (id: number) => updateAlert(id, { status: "ACK" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) =>
      updateAlert(id, {
        status: "CLOSED",
        cleared_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  if (isLoading) return <div>Chargement…</div>;
  if (isError || !data) {
    return <div>Erreur lors du chargement des alertes.</div>;
  }

  const isBusy =
    ackMutation.isPending || closeMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-4 max-w-6xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Alertes</h1>
        <p className="text-sm text-slate-500">
          Alertes générées par les capteurs, contrôleurs et stratégies.
        </p>
      </header>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Sévérité</th>
              <th className="px-3 py-2 text-left">Statut</th>
              <th className="px-3 py-2 text-left">Message</th>
              <th className="px-3 py-2 text-left">Zone</th>
              <th className="px-3 py-2 text-left">Exploitation</th>
              <th className="px-3 py-2 text-left">Déclenchée</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onAck={() => ackMutation.mutate(alert.id)}
                onClose={() => closeMutation.mutate(alert.id)}
                onDelete={() => deleteMutation.mutate(alert.id)}
                disabled={isBusy}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertRow({
  alert,
  onAck,
  onClose,
  onDelete,
  disabled,
}: {
  alert: AlertItem;
  onAck: () => void;
  onClose: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const severityClass =
    alert.severity === "CRITICAL"
      ? "text-red-600"
      : alert.severity === "WARNING"
      ? "text-amber-600"
      : "text-emerald-700";

  const statusClass =
    alert.status === "OPEN"
      ? "text-amber-700"
      : alert.status === "CLOSED"
      ? "text-slate-500"
      : "text-emerald-700";

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 text-slate-800">
      <td className="px-3 py-2">{alert.type}</td>
      <td className={`px-3 py-2 ${severityClass}`}>{alert.severity}</td>
      <td className={`px-3 py-2 ${statusClass}`}>{alert.status}</td>
      <td className="px-3 py-2 max-w-xs truncate" title={alert.message}>
        {alert.message}
      </td>
      <td className="px-3 py-2">
        {alert.zone ? (
          <Link
            to={`/zones/${alert.zone.id}`}
            className="underline decoration-slate-300 hover:text-slate-900"
          >
            {alert.zone.name}
          </Link>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {alert.farm ? alert.farm.name : <span className="text-slate-400">—</span>}
      </td>
      <td className="px-3 py-2 text-slate-500">
        {new Date(alert.raised_at).toLocaleString()}
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="secondary"
            size="xs"
            onClick={onAck}
            disabled={disabled || alert.status !== "OPEN"}
          >
            ACK
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={onClose}
            disabled={disabled || alert.status === "CLOSED"}
          >
            Fermer
          </Button>
          <Button
            variant="danger"
            size="xs"
            onClick={() => {
              if (confirm("Supprimer cette alerte ?")) onDelete();
            }}
            disabled={disabled}
          >
            Suppr
          </Button>
        </div>
      </td>
    </tr>
  );
}
