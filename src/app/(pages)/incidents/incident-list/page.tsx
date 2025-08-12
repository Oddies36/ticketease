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

type TicketRow = {
  id: number;
  number: string;
  title: string;
  creationDate: string;
  status?: { label: string };
  priority?: { label: string };
  assignmentGroup?: { groupName: string | null };
};

export default function IncidentListPage() {
  const router = useRouter();
  const search = useSearchParams();
  const locationName = search.get("localisation") || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

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
          setErrorMessage(
            err.error || "Erreur lors du chargement des incidents."
          );
          setTickets([]);
        } else {
          const data = await res.json();
          const list: TicketRow[] = data.tickets || [];
          setTickets(list);
        }
      } catch (e) {
        setErrorMessage("Erreur réseau.");
        setTickets([]);
      }

      setLoading(false);
    }

    loadTickets();
  }, [locationName]);

  function openTicket(id: number) {
    router.push("/incidents/ticket?id=" + String(id));
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Incidents — {locationName}
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Incidents — {locationName}
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
              <TableCell>Groupe</TableCell>
              <TableCell>Créé le</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((t) => (
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
                  {t.assignmentGroup ? t.assignmentGroup.groupName || "-" : "-"}
                </TableCell>
                <TableCell>
                  {new Date(t.creationDate).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
