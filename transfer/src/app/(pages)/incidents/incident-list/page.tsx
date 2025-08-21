"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from "@mui/material";

/**
 *  Structure minimale renvoyée par l’endpoint de liste.
 */
type TicketRow = {
  id: number;
  number: string;
  title: string;
  creationDate: string;
  closedDate?: string | null;
  responseDate?: string | null;
  status?: { label: string } | null;
  priority?: { label: string } | null;
  assignmentGroup?: { groupName: string | null } | null;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
  sla?: { responseTime: number; resolutionTime: number } | null;
};

/**
 * Composant: IncidentListPage
 * Description:
 *   Liste les incidents pour une localisation donnée
 *   - SLA réponse : temps restant tant que le ticket est "Ouvert", sinon "Répondu"
 *   - SLA résolution : "Clos" si le ticket est fermé, sinon temps restant
 *
 * Sources de données:
 *   - Incidents par localisation : /api/incidents/list-by-location?location=...
 *
 * Paramètres d’URL:
 *   - localisation: string
 */
export default function IncidentListPage() {
  /* ============================== ETATS ============================== */

  const router = useRouter();
  const search = useSearchParams();
  const locationName = search.get("localisation") || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Sert juste à rafraîchir l’affichage des délais chaque minute
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  /* ============================ USE EFFECTS =========================== */

  /**
   * Effet:
   *   Charge la liste des tickets pour la localisation fournie.
   */
  useEffect(() => {
    async function loadTickets() {
      setLoading(true);
      setErrorMessage("");

      try {
        const res = await fetch(
          "/api/incidents/list-by-location?location=" +
            encodeURIComponent(locationName)
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg =
            (err && (err as any).error) ||
            "Erreur lors du chargement des incidents.";
          setErrorMessage(msg);
          setTickets([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const list: TicketRow[] = Array.isArray(data?.tickets)
          ? (data.tickets as TicketRow[])
          : [];
        setTickets(list);
      } catch {
        setErrorMessage("Erreur");
        setTickets([]);
      }

      setLoading(false);
    }

    if (locationName.trim()) {
      loadTickets();
    } else {
      setErrorMessage("Paramètre 'localisation' manquant.");
      setTickets([]);
      setLoading(false);
    }
  }, [locationName]);

  /* ======================== HANDLERS / HELPERS ======================== */

  /**
   * Fonction: openTicket
   * Description:
   *   Navigation vers les détails d’un ticket.
   */
  function openTicket(id: number) {
    router.push("/incidents/ticket?id=" + String(id));
  }

  /**
   * Fonction: isOpenStatus
   * Description:
   *   Retourne true si le label de statut correspond à "Ouvert".
   */
  function isOpenStatus(label?: string | null): boolean {
    if (!label) return false;
    return label.toLowerCase() === "ouvert";
  }

  /**
   * Fonction: addMinutes
   * Description:
   *   Calcule une nouvelle date en ajoutant des minutes à une date de départ.
   */
  function addMinutes(date: string, minutes: number): string {
    const startTime = new Date(date).getTime();
    const resultTime = startTime + minutes * 60 * 1000;
    return new Date(resultTime).toISOString();
  }

  /**
   * Fonction: formatRemaining
   * Description:
   *   Formate le temps restant.
   *   Utilise l’état now pour se recalculer automatiquement chaque minute.
   */
  function formatRemaining(deadline?: string | null): string {
    if (!deadline) return "-";

    const deadlineTime = new Date(deadline).getTime();
    const nowTime = now;

    let difference = deadlineTime - nowTime;
    const isLate = difference < 0;
    if (isLate) difference = -difference;

    const totalMinutes = Math.floor(difference / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutesLeft = totalMinutes % 60;

    return isLate
      ? `En retard ${hours}h ${minutesLeft}m`
      : `${hours}h ${minutesLeft}m`;
  }

  /* ================================ RENDER ================================ */

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Incidents - {locationName || "-"}
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Incidents - {locationName || "-"}
      </Typography>

      {errorMessage ? (
        <Typography sx={{ mb: 2 }}>{errorMessage}</Typography>
      ) : null}

      <Paper sx={{ width: "100%" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Priorité</TableCell>
              <TableCell>Assigné à</TableCell>
              <TableCell>SLA réponse</TableCell>
              <TableCell>SLA résolution</TableCell>
              <TableCell>Créé le</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((t) => {
              const resolutionDeadline =
                t.sla && typeof t.sla.resolutionTime === "number"
                  ? addMinutes(t.creationDate, t.sla.resolutionTime)
                  : null;

              return (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => openTicket(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{t.number}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.status ? t.status.label : "-"}</TableCell>
                  <TableCell>{t.priority ? t.priority.label : "-"}</TableCell>
                  <TableCell>
                    {t.assignedTo
                      ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {t.responseDate && isOpenStatus(t.status?.label)
                      ? formatRemaining(t.responseDate)
                      : "Répondu"}
                  </TableCell>
                  <TableCell>
                    {t.closedDate
                      ? "Clos"
                      : resolutionDeadline
                        ? formatRemaining(resolutionDeadline)
                        : "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(t.creationDate).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
