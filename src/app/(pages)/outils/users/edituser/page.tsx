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
  Toolbar
} from "@mui/material";

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  emailProfessional: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
  manager: string
}

const Edituser: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [orderBy, setOrderBy] = useState<keyof UserData>("firstName");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

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

  const sortedUsers = [...users].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === "asc" ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === "asc" ? 1 : -1;
    return 0;
  });

  return (
      <Box>
        <Typography variant="h4" mb={3}>
          Modification d'un utilisateur
        </Typography>

        <Paper sx={{ width: "100%", mb: 2 }}>
          <Toolbar>
            <Typography variant="h6">Gestion des utilisateurs</Typography>
          </Toolbar>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    "Prénom",
                    "Nom",
                    "Email",
                    "Administrateur",
                    "Doit changer le mot de passe",
                    "Manager"
                  ].map((header, index) => (
                    <TableCell key={index}>
                      <TableSortLabel
                        active={
                          orderBy ===
                          ([
                            "firstName",
                            "lastName",
                            "emailProfessional",
                            "isAdmin",
                            "mustChangePassword",
                            "manager"
                          ][index] as keyof UserData)
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
                              "manager"
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
                  <TableRow
                    key={user.id}
                    hover
                    onClick={() => console.log(`Clicked user ${user.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.emailProfessional}</TableCell>
                    <TableCell>{user.isAdmin ? "Oui" : "Non"}</TableCell>
                    <TableCell>
                      {user.mustChangePassword ? "Oui" : "Non"}
                    </TableCell>
                    <TableCell>
                      {user.manager}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
  );
};

export default Edituser;
