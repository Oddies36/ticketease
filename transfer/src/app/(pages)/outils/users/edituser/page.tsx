"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";

type UserItem = {
  id: number;
  firstName: string;
  lastName: string;
  emailProfessional: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
  managerId: number | null;
};

type UserOption = {
  id: number;
  firstName: string;
  lastName: string;
};

export default function EditUserPage() {
  const router = useRouter();
  const search = useSearchParams();
  const locationName = search.get("location") || "";

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [managerId, setManagerId] = useState<number | "">("");

  const [managerOptions, setManagerOptions] = useState<UserOption[]>([]);

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const url = "/api/users/users-by-location?location=" + encodeURIComponent(locationName);
        const res = await fetch(url);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setErrorMessage(err.error || "Erreur lors du chargement des utilisateurs.");
          setUsers([]);
          setFilteredUsers([]);
        } else {
          const data = await res.json();
          const loaded: UserItem[] = data.users || [];
          setUsers(loaded);
          setFilteredUsers(loaded);

          const opts: UserOption[] = [];
          for (let i = 0; i < loaded.length; i++) {
            const u = loaded[i];
            const opt: UserOption = { id: u.id, firstName: u.firstName, lastName: u.lastName };
            opts.push(opt);
          }
          setManagerOptions(opts);
        }
      } catch (e) {
        setErrorMessage("Erreur réseau lors du chargement des utilisateurs.");
        setUsers([]);
        setFilteredUsers([]);
      }

      setIsLoading(false);
    }

    loadUsers();
  }, [locationName]);

  useEffect(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) {
      setFilteredUsers(users);
    } else {
      const list: UserItem[] = [];
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const fullName = (u.firstName + " " + u.lastName).toLowerCase();
        const email = u.emailProfessional.toLowerCase();

        if (fullName.includes(text) || email.includes(text)) {
          list.push(u);
        }
      }
      setFilteredUsers(list);

      if (selectedUserId !== "") {
        let stillExists = false;
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === selectedUserId) {
            stillExists = true;
            break;
          }
        }
        if (!stillExists) {
          setSelectedUserId("");
          setSelectedUser(null);
          setIsAdmin(false);
          setMustChangePassword(false);
          setManagerId("");
        }
      }
    }
  }, [searchText, users]);

  useEffect(() => {
    if (selectedUserId === "") {
      setSelectedUser(null);
      setIsAdmin(false);
      setMustChangePassword(false);
      setManagerId("");
      return;
    }

    let found: UserItem | null = null;
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (u.id === selectedUserId) {
        found = u;
        break;
      }
    }

    if (found) {
      setSelectedUser(found);
      setIsAdmin(found.isAdmin);
      setMustChangePassword(found.mustChangePassword);
      if (typeof found.managerId === "number") {
        setManagerId(found.managerId);
      } else {
        setManagerId("");
      }
    } else {
      setSelectedUser(null);
      setIsAdmin(false);
      setMustChangePassword(false);
      setManagerId("");
    }
  }, [selectedUserId, users]);

  async function handleSave() {
    if (selectedUserId === "") {
      alert("Veuillez sélectionner un utilisateur.");
      return;
    }

    const body: any = {
      userId: selectedUserId,
      isAdmin: isAdmin,
      mustChangePassword: mustChangePassword,
    };

    if (managerId === "") {
      body.managerId = null;
    } else {
      body.managerId = managerId;
    }

    const res = await fetch("/api/users/update-user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || "Erreur lors de la mise à jour.");
      return;
    }

    const updated: UserItem[] = [];
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (u.id === selectedUserId) {
        const changed: UserItem = {
          ...u,
          isAdmin: isAdmin,
          mustChangePassword: mustChangePassword,
          managerId: managerId === "" ? null : (managerId as number),
        };
        updated.push(changed);
      } else {
        updated.push(u);
      }
    }
    setUsers(updated);

    router.push("/outils");
  }

  function renderContent() {
    if (isLoading) {
      return <CircularProgress />;
    } else {
      if (errorMessage && users.length === 0) {
        return <Typography>{errorMessage}</Typography>;
      } else {
        if (users.length === 0) {
          return <Typography>Aucun utilisateur dans cette localisation.</Typography>;
        } else {
          return (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ backgroundColor: "#f4f5f7" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sélection de l'utilisateur
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      label="Recherche (nom, email)"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <Box sx={{ border: "1px solid #ddd", borderRadius: 1, maxHeight: 360, overflow: "auto" }}>
                      <List dense>
                        {filteredUsers.map((u, idx) => {
                          const label = u.lastName + " " + u.firstName + " — " + u.emailProfessional;
                          const isSelected = selectedUserId === u.id;

                          return (
                            <React.Fragment key={u.id}>
                              <ListItemButton
                                selected={isSelected}
                                onClick={() => setSelectedUserId(u.id)}
                              >
                                <ListItemText primary={label} />
                              </ListItemButton>
                              {idx < filteredUsers.length - 1 ? <Divider component="li" /> : null}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {selectedUser ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ backgroundColor: "#f4f5f7" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Détails de l'utilisateur
                      </Typography>

                      <TextField
                        label="Localisation"
                        value={locationName}
                        fullWidth
                        size="small"
                        margin="dense"
                        disabled
                      />
                      <TextField
                        label="Email professionnel"
                        value={selectedUser.emailProfessional}
                        fullWidth
                        size="small"
                        margin="dense"
                        disabled
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isAdmin}
                            onChange={(e) => setIsAdmin(e.target.checked)}
                          />
                        }
                        label="Administrateur ?"
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={mustChangePassword}
                            onChange={(e) => setMustChangePassword(e.target.checked)}
                          />
                        }
                        label="Doit changer le mot de passe"
                      />

                      <Typography variant="body2" sx={{ mt: 2, mb: 0.5 }}>
                        Manager
                      </Typography>
                      <Select
                        fullWidth
                        size="small"
                        value={managerId}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (isNaN(value)) {
                            setManagerId("");
                          } else {
                            setManagerId(value);
                          }
                        }}
                        displayEmpty
                      >
                        <MenuItem value="">— Aucun —</MenuItem>
                        {managerOptions.map((m) => {
                          const label = m.firstName + " " + m.lastName;
                          return (
                            <MenuItem key={m.id} value={m.id}>
                              {label}
                            </MenuItem>
                          );
                        })}
                      </Select>

                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button variant="contained" onClick={handleSave}>
                          Enregistrer
                        </Button>
                        <Button variant="outlined" onClick={() => router.back()}>
                          Retour
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ) : null}
            </Grid>
          );
        }
      }
    }
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Modifier un utilisateur — {locationName}
      </Typography>
      {renderContent()}
    </Box>
  );
}
