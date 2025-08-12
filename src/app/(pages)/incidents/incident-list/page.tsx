import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";

interface PageProps {
  searchParams: { localisation?: string };
}

export default async function IncidentListPage({ searchParams }: PageProps) {
  const locationName = searchParams.localisation;

  if (!locationName) {
    return <Typography>Aucune localisation sélectionnée.</Typography>;
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return <Typography>Utilisateur non authentifié.</Typography>;
  }

  const location = await prisma.location.findUnique({
    where: { name: locationName },
    select: { id: true, name: true },
  });

  if (!location) {
    return <Typography>Localisation inconnue : {locationName}</Typography>;
  }

  // Vérifie que l’utilisateur a bien accès à cette localisation via un groupe support
  const groupAccess = await prisma.groupUser.findFirst({
    where: {
      userId: user.id,
      group: {
        groupName: { startsWith: "Support.Incidents." },
        locationId: location.id,
      },
    },
  });

  if (!groupAccess) {
    return <Typography>Accès refusé à la localisation {location.name}. Veuillez faire une demande pour les accès.</Typography>;
  }

  const incidents = await prisma.ticket.findMany({
    where: {
      locationId: location.id,
      type: "incident",
    },
    orderBy: { creationDate: "desc" },
    select: {
      id: true,
      number: true,
      title: true,
      status: { select: { label: true } },
      creationDate: true,
    },
  });

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Incidents – {location.name}
      </Typography>

      <List>
        {incidents.map((incident) => (
          <ListItem key={incident.id}>
            <ListItemText
              primary={`${incident.number} - ${incident.title}`}
              secondary={`Statut : ${incident.status.label} | Créé le : ${new Date(
                incident.creationDate
              ).toLocaleDateString()}`}
            />
          </ListItem>
        ))}
        {incidents.length === 0 && (
          <Typography>Aucun incident pour cette localisation.</Typography>
        )}
      </List>
    </Box>
  );
}
