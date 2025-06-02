"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Typography,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  emailProfessional: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
}

const Deleteuser: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [orderBy, setOrderBy] = useState<keyof UserData>("firstName");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch("/api/users/get-users");
      const data = await response.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleSort = (property: keyof UserData) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const confirmDeleteUser = (id: number) => {
    setConfirmDelete(id);
  };

  const deleteUser = async () => {
    if (confirmDelete !== null) {
      const response = await fetch(
        `/api/users/delete-user?id=${confirmDelete}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (result.success) {
        setUsers(users.filter((user) => user.id !== confirmDelete));
      } else {
        alert("Erreur: " + result.message);
      }

      setConfirmDelete(null);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === "asc" ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === "asc" ? 1 : -1;
    return 0;
  });

  return (
      <Box>
        <Typography variant="h4" mb={3}>
          Suppression d'un utilisateur
        </Typography>

        <Paper sx={{ width: "100%", mb: 2 }}>
          <Toolbar>
            <Typography variant="h6">Suppression des utilisateurs</Typography>
          </Toolbar>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  {[
                    "Prénom",
                    "Nom",
                    "Email",
                    "Administrateur",
                    "Doit changer le mot de passe",
                  ].map((header, index) => (
                    <TableCell key={index}>
                      <TableSortLabel
                        active={
                          orderBy ===
                          [
                            "firstName",
                            "lastName",
                            "emailProfessional",
                            "isAdmin",
                            "mustChangePassword",
                          ][index]
                        }
                        direction={order}
                        onClick={() =>
                          handleSort(
                            [
                              "firstName",
                              "lastName",
                              "emailProfessional",
                              "isAdmin",
                              "mustChangePassword",
                            ][index] as keyof UserData
                          )
                        }
                      >
                        {header}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <IconButton onClick={() => confirmDeleteUser(user.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.emailProfessional}</TableCell>
                    <TableCell>{user.isAdmin ? "Oui" : "Non"}</TableCell>
                    <TableCell>
                      {user.mustChangePassword ? "Oui" : "Non"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog
          open={confirmDelete !== null}
          onClose={() => setConfirmDelete(null)}
        >
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            Êtes-vous sûr de vouloir supprimer cet utilisateur ?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button onClick={deleteUser} color="error">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Deleteuser;
