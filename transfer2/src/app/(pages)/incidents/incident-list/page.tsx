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
  TableSortLabel,
  CircularProgress,
  TableContainer,
  TablePagination,
} from "@mui/material";

// Ticket renvoyé par l'api incidents
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
  isBreached: boolean;
};

// Sens du tri
type Order = "asc" | "desc";

export default function IncidentListPage() {
  const router = useRouter();
  const search = useSearchParams();
  const locationName = search.get("localisation") || "";
  const breached = search.get("breached") || "";

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [orderBy, setOrderBy] = useState<keyof TicketRow>("number");
  const [order, setOrder] = useState<Order>("asc");

  const [page, setPage] = useState(0);
  const rowsPerPage = 30;

  // rafraîchit le temps restant
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // charge les tickets de la localisation
  useEffect(() => {
    async function loadTickets() {
      setLoading(true);
      setErrorMessage("");

      try {
        let url =
          "/api/incidents/list-by-location?location=" +
          encodeURIComponent(locationName);

        if (breached) url += "&breached=1";

        const res = await fetch(url);
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
        setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
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
  }, [locationName, breached]);

  // ouvre un ticket
  function openTicket(id: number) {
    router.push("/incidents/ticket?id=" + String(id));
  }

  // Affiche temps restant ou En retard
  function formatRemaining(deadline: string): string {
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;
    if (diff <= 0) return "En retard";
    const totalMinutes = Math.floor(diff / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m restants`;
  }

  // affichage SLA réponse
  function formatSlaResponse(ticket: TicketRow): React.ReactNode {
    if (ticket.responseDate) {
      const deadline = new Date(ticket.responseDate).getTime();
      if (now > deadline) {
        return <span style={{ color: "red" }}>En retard</span>;
      }
      return <>{formatRemaining(ticket.responseDate)}</>;
    }
    return <>Répondu</>;
  }

  // affichage SLA résolution
  function formatSlaResolution(ticket: TicketRow): React.ReactNode {
    if (ticket.closedDate) {
      return <>Clos</>;
    }
    if (ticket.sla?.resolutionTime) {
      const deadline =
        new Date(ticket.creationDate).getTime() +
        ticket.sla.resolutionTime * 60000;
      if (now > deadline) {
        return <span style={{ color: "red" }}>En retard</span>;
      }
      return <>{formatRemaining(new Date(deadline).toISOString())}</>;
    }
    return <>-</>;
  }

  // valeur numérique pour tri SLA réponse
  function getSlaResponseSortValue(ticket: TicketRow): number {
    if (!ticket.responseDate) return 0; // déjà répondu
    const deadline = new Date(ticket.responseDate).getTime();
    return deadline - now; // négatif = en retard, positif = temps restant
  }

  /**
   * Convertit un champ de ticket en valeur simple afin de permettre le tri correct dans le tableau
   */
  function getSortableValue(ticket: TicketRow, key: keyof TicketRow): any {
    switch (key) {
      case "status":
        return ticket.status?.label || "";
      case "priority":
        return ticket.priority?.label || "";
      case "assignedTo":
        return ticket.assignedTo
          ? `${ticket.assignedTo.lastName} ${ticket.assignedTo.firstName}`
          : "";
      case "creationDate":
      case "closedDate":
        return ticket[key] ? new Date(ticket[key] as string).getTime() : 0;
      case "responseDate":
        return getSlaResponseSortValue(ticket);
      case "number":
        return ticket.number || "";
      default:
        return ticket[key] ?? "";
    }
  }

  // tri des colonnes
  const handleSort = (property: keyof TicketRow) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // tickets triés
  const sortedTickets = [...tickets].sort((a, b) => {
    const aValue = getSortableValue(a, orderBy);
    const bValue = getSortableValue(b, orderBy);
    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });

  // tickets paginés
  const paginatedTickets = sortedTickets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        Incidents - {locationName || "-"} {breached ? "en retard" : ""}
      </Typography>

      {errorMessage && <Typography sx={{ mb: 2 }}>{errorMessage}</Typography>}

      <Paper sx={{ width: "100%" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[
                  { id: "number", label: "Numéro" },
                  { id: "title", label: "Titre" },
                  { id: "status", label: "Statut" },
                  { id: "priority", label: "Priorité" },
                  { id: "assignedTo", label: "Assigné à" },
                  { id: "responseDate", label: "SLA réponse" },
                  { id: "closedDate", label: "SLA résolution" },
                  { id: "creationDate", label: "Créé le" },
                ].map((col) => (
                  <TableCell key={col.id}>
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : "asc"}
                      onClick={() => handleSort(col.id as keyof TicketRow)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTickets.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => openTicket(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{t.number}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.status?.label || "-"}</TableCell>
                  <TableCell>{t.priority?.label || "-"}</TableCell>
                  <TableCell>
                    {t.assignedTo
                      ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
                      : "-"}
                  </TableCell>
                  <TableCell>{formatSlaResponse(t)}</TableCell>
                  <TableCell>{formatSlaResolution(t)}</TableCell>
                  <TableCell>
                    {new Date(t.creationDate).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={tickets.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[30]}
          labelRowsPerPage="Lignes par page"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
        />
      </Paper>
    </Box>
  );
}
