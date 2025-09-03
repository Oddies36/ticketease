"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Toolbar,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

/**
 * Type représentant un utilisateur pour l'annuaire.
 * Correspond à ce que renvoie l'API /api/users/get-users.
 */
interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  emailProfessional: string;
}

const Annuaire: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState<keyof UserData>("lastName");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Récupération des utilisateurs au montage
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users/get-users");
      const data = await res.json();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  // Gestion du tri par colonne
  const handleSort = (property: keyof UserData) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Filtrage selon la recherche
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search) ||
      user.emailProfessional.toLowerCase().includes(search)
    );
  });

  // Tri des résultats filtrés
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === "asc" ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Annuaire
      </Typography>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">Liste des utilisateurs</Typography>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Toolbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                {["Nom", "Prénom", "Email"].map((header, index) => (
                  <TableCell key={index}>
                    <TableSortLabel
                      active={
                        orderBy ===
                        (["lastName", "firstName", "emailProfessional"][
                          index
                        ] as keyof UserData)
                      }
                      direction={order}
                      onClick={() =>
                        handleSort(
                          ["lastName", "firstName", "emailProfessional"][
                            index
                          ] as keyof UserData
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
                <TableRow key={user.id}>
                  <TableCell>{user.lastName}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.emailProfessional}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Annuaire;
