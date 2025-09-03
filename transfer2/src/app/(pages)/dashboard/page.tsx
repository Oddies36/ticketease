"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";

/**
 *   Représente une ligne minimale de ticket ou de tâche comme c'est renvoyée
 *   par les endpoints de liste. On l'utilise dans la génération des listes de tickets.
 */
type TicketRow = {
  id: number;
  number: string;
  title: string;
  creationDate: string;
  status?: { label?: string } | null;
};

/**
 * Composant: Dashboard
 * Description:
 *   Affiche les compteurs suivants pour l'utilisateur connecté :
 *   - Incidents ouverts et incidents clôturés pour chaque localisation accessible par l'utilisateur
 *   - Tâches ouvertes et tâches clôturées pour chaque localisation accessible par l'utilisateur
 *   - Nombre de demandes à valider
 *
 * Sources de données:
 *   - Localisations incidents    : /api/groupes/available-locations?prefix=Support.Incidents.
 *   - Localisations tâches       : /api/groupes/available-locations?prefix=Support.Taches.
 *   - Incidents par localisation : /api/incidents/list-by-location?location=...
 *   - Tâches par localisation    : /api/tasks/listbylocation?location=...
 *   - Demandes à valider         : /api/tasks/pendingapprovals
 */
export default function Dashboard() {
  /* ============================== ETATS ============================== */

  // Indicateur de chargement
  const [loading, setLoading] = useState<boolean>(true);

  // Compteurs d'incidents
  const [incidentOpenCount, setIncidentOpenCount] = useState<number>(0);
  const [incidentClosedCount, setIncidentClosedCount] = useState<number>(0);

  // Compteurs de tâches
  const [taskOpenCount, setTaskOpenCount] = useState<number>(0);
  const [taskClosedCount, setTaskClosedCount] = useState<number>(0);

  // Nombre de demandes en attente de validation
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number>(0);

  /* ============================ USE EFFECTS =========================== */

  /**
   * Description:
   *   Charge toutes les données nécessaires au tableau de bord :
   *   - localisations incidents et tâches
   *   - listes par localisations
   *   - agrégation ouvert/clos
   *   - nombre de demandes à valider
   */
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);

      try {
        const [incidentLocations, taskLocations] = await Promise.all([
          getLocationsWithPrefix("Support.Incidents."),
          getLocationsWithPrefix("Support.Taches."),
        ]);

        const [incidentRows, taskRows, approvalsCount] = await Promise.all([
          getIncidentsForLocations(incidentLocations),
          getTasksForLocations(taskLocations),
          getPendingApprovalsCount(),
        ]);

        const incidentCounters = countOpenClosedByStatus(incidentRows);
        const taskCounters = countOpenClosedByStatus(taskRows);

        setIncidentOpenCount(incidentCounters.open);
        setIncidentClosedCount(incidentCounters.closed);
        setTaskOpenCount(taskCounters.open);
        setTaskClosedCount(taskCounters.closed);
        setPendingApprovalCount(approvalsCount);
      } catch {
        // On garde les compteurs à 0
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  /* ===================== FONCTIONS UTILITAIRES ===================== */

  /**
   * Fonction: getLocationsWithPrefix
   * Description:
   *   Récupère les noms de localisations pour un préfixe de groupe donné.
   * Paramètres:
   *   - prefix: string
   * Retourne:
   *   - Promise<string[]> - liste des localisations, vide en cas d'erreur
   */
  async function getLocationsWithPrefix(prefix: string): Promise<string[]> {
    try {
      const response = await fetch(
        "/api/groupes/available-locations?prefix=" + encodeURIComponent(prefix)
      );
      const data = await response.json();
      return Array.isArray(data?.locations) ? data.locations : [];
    } catch {
      return [];
    }
  }

  /**
   * Fonction: fetchIncidentsForLocation
   * Description:
   *   Récupère la liste des incidents pour une localisation.
   * Paramètres:
   *   - locationName: string - nom de la localisation
   * Retourne:
   *   - Promise<TicketRow[]> - incidents de la localisation
   */
  async function fetchIncidentsForLocation(
    locationName: string
  ): Promise<TicketRow[]> {
    try {
      const response = await fetch(
        "/api/incidents/list-by-location?location=" +
          encodeURIComponent(locationName)
      );
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data?.tickets) ? data.tickets : [];
    } catch {
      return [];
    }
  }

  /**
   * Fonction: fetchTasksForLocation
   * Description:
   *   Récupère la liste des tâches pour une localisation.
   * Paramètres:
   *   - locationName: string - nom de la localisation
   * Retourne:
   *   - Promise<TicketRow[]> - tâches de la localisation
   */
  async function fetchTasksForLocation(
    locationName: string
  ): Promise<TicketRow[]> {
    try {
      const response = await fetch(
        "/api/tasks/listbylocation?location=" + encodeURIComponent(locationName)
      );
      if (!response.ok) return [];
      const data = await response.json();
      if (Array.isArray(data?.tasks)) return data.tasks;
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Fonction: getIncidentsForLocations
   * Description:
   *   Récupère la liste des incidents sur plusieurs localisations.
   * Paramètres:
   *   - locationNames: string[] - noms de localisations
   * Retourne:
   *   - Promise<TicketRow[]> - incidents tous lieux confondus
   */
  async function getIncidentsForLocations(
    locationNames: string[]
  ): Promise<TicketRow[]> {
    const perLocationLists = await Promise.all(
      locationNames.map((name) => fetchIncidentsForLocation(name))
    );
    return perLocationLists.flat();
  }

  /**
   * Fonction: getTasksForLocations
   * Description:
   *   Récupère et aplatit la liste des tâches sur plusieurs localisations.
   * Paramètres:
   *   - locationNames: string[] - noms de localisations
   * Retourne:
   *   - Promise<TicketRow[]> - tâches tous lieux confondus
   */
  async function getTasksForLocations(
    locationNames: string[]
  ): Promise<TicketRow[]> {
    const perLocationLists = await Promise.all(
      locationNames.map((name) => fetchTasksForLocation(name))
    );
    return perLocationLists.flat();
  }

  /**
   * Fonction: getPendingApprovalsCount
   * Description:
   *   Récupère le nombre de demandes en attente de validation.
   * Paramètres:
   *   - aucun
   * Retourne:
   *   - Promise<number> - total des demandes à valider
   */
  async function getPendingApprovalsCount(): Promise<number> {
    try {
      const response = await fetch("/api/tasks/pendingapprovals");
      if (!response.ok) return 0;
      const data = await response.json();
      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data?.tasks)) return data.tasks.length;
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Fonction: countOpenClosedByStatus
   * Description:
   *   Compte combien de tickets sont ouverts et combien sont clos
   * Paramètres:
   *   - rows: TicketRow[] - lignes à analyser
   * Retourne:
   *   - { open: number; closed: number } - totaux ouverts/clos
   */
  function countOpenClosedByStatus(rows: TicketRow[]) {
    let open = 0;
    let closed = 0;

    for (const row of rows) {
      const label =
        typeof row.status?.label === "string" ? row.status.label : "";
      if (label === "Clôturé") {
        closed++;
      } else {
        open++;
      }
    }
    return { open, closed };
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Dashboard
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <Typography variant="h6">Incidents ouverts</Typography>
              <Typography>{incidentOpenCount}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <Typography variant="h6">Incidents clôturés</Typography>
              <Typography>{incidentClosedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <Typography variant="h6">Tâches ouvertes</Typography>
              <Typography>{taskOpenCount}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <Typography variant="h6">Tâches clôturées</Typography>
              <Typography>{taskClosedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <Typography variant="h6">Demandes à valider</Typography>
              <Typography>{pendingApprovalCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
