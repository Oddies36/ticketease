"use client";

import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  List,
  ListItem,
  Divider,
  Button,
  Modal,
  Backdrop,
  Fade,
  CircularProgress,
  TextField,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { authRedirect } from "@/app/components/authRedirect";

type Group = {
  id: number;
  groupName: string;
  description: string | null;
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

const Groupes: React.FC = () => {
  const { user, loading } = authRedirect();
  const [adminGroups, setAdminGroups] = useState<Group[]>([]);
  const [memberGroups, setMemberGroups] = useState<Group[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupUsers, setGroupUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [modalType, setModalType] = useState<"admins" | "members" | null>(null);

  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newUserId, setNewUserId] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {
      const res = await fetch(`/api/groupes/get-groupes?userId=${user.id}`);
      const data = await res.json();
      setAdminGroups(data.adminGroups);
      setMemberGroups(data.memberGroups);
    };

    fetchGroups();
  }, [user]);

  const isCurrentUserAdmin = () => {
    return selectedGroup && adminGroups.some((g) => g.id === selectedGroup.id);
  };

  const handleOpenModal = async (group: Group, type: "admins" | "members") => {
    setSelectedGroup(group);
    setModalType(type);
    setModalOpen(true);
    setLoadingUsers(true);

    try {
      const res = await fetch(`/api/groupes/view-users?groupId=${group.id}`);
      const data = await res.json();
      setGroupUsers(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des membres:", err);
      setGroupUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setGroupUsers([]);
    setSelectedGroup(null);
    setModalType(null);
    setNewUserId("");
    setUserOptions([]);
  };

  const fetchUsers = async (query: string) => {
    if (!query) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/get-users?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setUserOptions(data);
    } finally {
      setSearchLoading(false);
    }
  };

const handleAddUser = async () => {
  if (!newUserId || !selectedGroup) return;

  try {
    const res = await fetch("/api/groupes/add-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: selectedGroup.id,
        userId: parseInt(newUserId),
        isAdmin: modalType === "admins",
      }),
    });

    if (res.ok) {
      const updated = await res.json();

      const refresh = await fetch(`/api/groupes/view-users?groupId=${selectedGroup.id}`);
      const newList = await refresh.json();
      setGroupUsers(newList);

      handleCloseModal();
    } else {
      const error = await res.json();
      alert(error.message || "Erreur");
    }
  } catch (e) {
    console.error("Erreur ajout:", e);
    alert("Erreur serveur");
  }
};

  if (loading || !user) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mes groupes
      </Typography>

      <Typography variant="h6" sx={{ mt: 3 }}>
        Groupes administrés
      </Typography>
      <List>
        {adminGroups.length === 0 && <ListItem>Aucun groupe administré.</ListItem>}
        {adminGroups.map((group) => (
          <ListItem key={group.id} sx={{ display: "flex", justifyContent: "space-between" }}>
            {group.groupName}
            <Button size="small" onClick={() => handleOpenModal(group, "admins")}>
              Voir les administrateurs
            </Button>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6">Groupes membres</Typography>
      <List>
        {memberGroups.length === 0 && <ListItem>Aucun groupe rejoint.</ListItem>}
        {memberGroups.map((group) => (
          <ListItem key={group.id} sx={{ display: "flex", justifyContent: "space-between" }}>
            {group.groupName}
            <Button size="small" onClick={() => handleOpenModal(group, "members")}>
              Voir les membres
            </Button>
          </ListItem>
        ))}
      </List>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={modalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6" mb={2}>
              {modalType === "admins"
                ? `Administrateurs de ${selectedGroup?.groupName}`
                : `Membres de ${selectedGroup?.groupName}`}
            </Typography>

            {loadingUsers ? (
              <CircularProgress />
            ) : groupUsers.length === 0 ? (
              <Typography>Aucun utilisateur trouvé.</Typography>
            ) : modalType === "admins" ? (
              groupUsers
                .filter((u) => u.isAdmin)
                .map((u) => (
                  <Typography key={u.id}>
                    {u.firstName} {u.lastName}
                  </Typography>
                ))
            ) : (
              groupUsers.map((u) => (
                <Typography key={u.id}>
                  {u.firstName} {u.lastName} {u.isAdmin ? "(Admin)" : ""}
                </Typography>
              ))
            )}

            {isCurrentUserAdmin() && (
              <Box mt={3}>
                <Autocomplete
                  fullWidth
                  options={userOptions}
                  loading={searchLoading}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                  onInputChange={(_, value) => fetchUsers(value)}
                  onChange={(_, value) => setNewUserId(value?.id.toString() || "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Rechercher un utilisateur"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {searchLoading ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 1 }}
                  onClick={handleAddUser}
                >
                  Ajouter
                </Button>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default Groupes;
