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
  isAdmin: boolean; // admin du groupe (pas admin du site)
};

const Groupes: React.FC = () => {
  const { user, loading } = authRedirect();

  // Listes "mes groupes"
  const [adminGroups, setAdminGroups] = useState<Group[]>([]);
  const [memberGroups, setMemberGroups] = useState<Group[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [modalType, setModalType] = useState<"admins" | "members" | null>(null);

  // Utilisateurs du groupe affichés dans le modal
  const [groupUsers, setGroupUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Recherche / ajout d’utilisateur
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newUserId, setNewUserId] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {
      try {
        const res = await fetch(`/api/groupes/get-groupes?userId=${user.id}`);
        const data = await res.json();
        setAdminGroups(data.adminGroups || []);
        setMemberGroups(data.memberGroups || []);
      } catch {
        setAdminGroups([]);
        setMemberGroups([]);
      }
    };

    fetchGroups();
  }, [user]);

  const isCurrentUserAdmin = () => {
    if (!selectedGroup) return false;
    // on considère que l’API classe aussi les groupes "owner" dans adminGroups
    return adminGroups.some((g) => g.id === selectedGroup.id);
  };

  const handleOpenModal = async (group: Group, type: "admins" | "members") => {
    setSelectedGroup(group);
    setModalType(type);
    setModalOpen(true);
    setLoadingUsers(true);

    try {
      const res = await fetch(`/api/groupes/view-users?groupId=${group.id}`);
      const data = await res.json();
      setGroupUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors de la récupération des membres:", err);
      setGroupUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedGroup(null);
    setModalType(null);
    setGroupUsers([]);
    setNewUserId("");
    setUserOptions([]);
  };

  // Recherche des utilisateurs (autocomplete)
  const fetchUsers = async (query: string) => {
    if (!query) {
      setUserOptions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/users/get-users?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setUserOptions(Array.isArray(data) ? data : []);
    } catch {
      setUserOptions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserId || !selectedGroup || !modalType) return;

    try {
      const r = await fetch("/api/groupes/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          userId: parseInt(newUserId, 10),
          isAdmin: modalType === "admins",
        }),
      });

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        alert(e.message || e.error || "Erreur");
        return;
      }

      // refresh liste
      const refresh = await fetch(
        `/api/groupes/view-users?groupId=${selectedGroup.id}`
      );
      const newList = await refresh.json();
      setGroupUsers(Array.isArray(newList) ? newList : []);

      // reset form
      setNewUserId("");
      setUserOptions([]);
    } catch (e) {
      console.error("Erreur ajout:", e);
      alert("Erreur serveur");
    }
  };

  const handleRemoveUser = async (userIdToRemove: number) => {
    if (!selectedGroup) return;
    if (!window.confirm("Retirer cet utilisateur du groupe ?")) return;

    try {
      const r = await fetch("/api/groupes/remove-member", {
        method: "POST", // volontairement POST (voir API)
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          userId: userIdToRemove,
        }),
      });

      const data = await r.json();
      if (!r.ok) {
        alert(data.error || "Erreur");
        return;
      }

      // refresh liste
      const refresh = await fetch(
        `/api/groupes/view-users?groupId=${selectedGroup.id}`
      );
      const newList = await refresh.json();
      setGroupUsers(Array.isArray(newList) ? newList : []);
    } catch (e) {
      console.error("Erreur suppression:", e);
      alert("Erreur serveur");
    }
  };

  if (loading || !user) return null;

  // Compte d’admins du groupe (pour désactiver la suppression du dernier admin)
  const adminCount = groupUsers.filter((u) => u.isAdmin).length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mes groupes
      </Typography>

      <List>
        {memberGroups.length === 0 && (
          <ListItem>Aucun groupe rejoint.</ListItem>
        )}
        {memberGroups.map((group) => (
          <ListItem
            key={group.id}
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            {group.groupName}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                onClick={() => handleOpenModal(group, "admins")}
              >
                Voir les administrateurs
              </Button>
              <Button
                size="small"
                onClick={() => handleOpenModal(group, "members")}
              >
                Voir les membres
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* MODAL */}
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
              width: 480,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6" mb={2}>
              {modalType === "admins"
                ? `Administrateurs de ${selectedGroup?.groupName ?? ""}`
                : `Membres de ${selectedGroup?.groupName ?? ""}`}
            </Typography>

            {loadingUsers ? (
              <CircularProgress />
            ) : groupUsers.length === 0 ? (
              <Typography>Aucun utilisateur trouvé.</Typography>
            ) : modalType === "admins" ? (
              // Liste "admins"
              groupUsers
                .filter((u) => u.isAdmin)
                .map((u) => (
                  <Box
                    key={u.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography>
                      {u.firstName} {u.lastName}
                    </Typography>
                    {isCurrentUserAdmin() && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleRemoveUser(u.id)}
                        disabled={adminCount <= 1} // empêche de retirer le dernier admin
                      >
                        Retirer
                      </Button>
                    )}
                  </Box>
                ))
            ) : (
              // Liste "members"
              groupUsers.map((u) => (
                <Box
                  key={u.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography>
                    {u.firstName} {u.lastName} {u.isAdmin ? "(Admin)" : ""}
                  </Typography>
                  {isCurrentUserAdmin() && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleRemoveUser(u.id)}
                      disabled={u.isAdmin && adminCount <= 1}
                    >
                      Retirer
                    </Button>
                  )}
                </Box>
              ))
            )}

            {/* Bloc ajout (visible seulement pour un admin du groupe) */}
            {isCurrentUserAdmin() && (
              <Box mt={3}>
                <Autocomplete
                  fullWidth
                  options={userOptions}
                  loading={searchLoading}
                  getOptionLabel={(option) =>
                    `${option.firstName} ${option.lastName}`
                  }
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  onInputChange={(_, value) => fetchUsers(value)}
                  onChange={(_, value) =>
                    setNewUserId(value ? String(value.id) : "")
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Rechercher un utilisateur"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {searchLoading ? (
                              <CircularProgress size={20} />
                            ) : null}
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
                  disabled={!newUserId}
                >
                  {modalType === "admins"
                    ? "Ajouter comme admin"
                    : "Ajouter au groupe"}
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
