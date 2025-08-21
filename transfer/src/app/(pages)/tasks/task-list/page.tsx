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

type TaskRow = {
  id: number;
  number: string;
  title: string;
  creationDate: string;
  status?: { label: string } | null;
  priority?: { label: string } | null;
  assignmentGroup?: { groupName: string | null } | null;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
};

export default function TaskListPage() {
  const router = useRouter();
  const search = useSearchParams();
  const locationName = search.get("localisation") || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setErrorMessage("");

      try {
        const url =
          "/api/tasks/listbylocation?location=" +
          encodeURIComponent(locationName);

        const res = await fetch(url);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setErrorMessage(
            (err && err.error) || "Erreur lors du chargement des demandes."
          );
          setTasks([]);
        } else {
          const data = await res.json();
          const list: TaskRow[] = [];
          if (data && Array.isArray(data.tasks)) {
            for (let i = 0; i < data.tasks.length; i++) {
              const t = data.tasks[i];
              const item: TaskRow = {
                id: t.id,
                number: t.number,
                title: t.title,
                creationDate: t.creationDate,
                status: t.status || null,
                priority: t.priority || null,
                assignmentGroup: t.assignmentGroup || null,
                assignedTo: t.assignedTo || null,
              };
              setTasks((prev) => {
                const copy = [...prev];
                return list;
              });
              list.push(item);
            }
          }
          setTasks(list);
        }
      } catch (e) {
        setErrorMessage("Erreur réseau.");
        setTasks([]);
      }

      setLoading(false);
    }

    loadTasks();
  }, [locationName]);

  function openTask(id: number) {
    router.push("/tasks/task?id=" + String(id));
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Demandes — {locationName}
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Demandes — {locationName}
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
              <TableCell>Assigné à</TableCell>
              <TableCell>Créé le</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((t) => {
              let assignedToLabel = "-";
              if (
                t.assignedTo &&
                t.assignedTo.firstName &&
                t.assignedTo.lastName
              ) {
                assignedToLabel =
                  t.assignedTo.firstName + " " + t.assignedTo.lastName;
              }
              return (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => openTask(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{t.number}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.status ? t.status.label : "-"}</TableCell>
                  <TableCell>{t.priority ? t.priority.label : "-"}</TableCell>
                  <TableCell>
                    {t.assignmentGroup
                      ? t.assignmentGroup.groupName || "-"
                      : "-"}
                  </TableCell>
                  <TableCell>{assignedToLabel}</TableCell>
                  <TableCell>
                    {t.creationDate
                      ? new Date(t.creationDate).toLocaleString()
                      : "-"}
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
