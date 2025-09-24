"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  Toolbar,
  TextField,
  InputAdornment,
  TableContainer,
  TablePagination,
  Button,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

// Ordinateur renvoyé par l'API CMDB
type ComputerRow = {
  id: number;
  computerName: string;
  serialNumber: string;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
  assignedAt?: string | null;
  createdAt?: string | null;
};

// Sens du tri pour les tableaux
type Order = "asc" | "desc";

export default function CmdbPage() {
  const [items, setItems] = useState<ComputerRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [orderBy, setOrderBy] = useState<keyof ComputerRow>("computerName");
  const [order, setOrder] = useState<Order>("asc");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Charge les ordinateurs depuis l'api
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url =
          "/api/cmdb/computers?search=" +
          encodeURIComponent(searchText) +
          "&page=" +
          String(page + 1) +
          "&pageSize=" +
          String(rowsPerPage);

        const res = await fetch(url);
        if (res.status === 403) {
          setAccessDenied(true);
          setItems([]);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setItems([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setItems(data.items as ComputerRow[]);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [page, searchText]);

  // Gère le tri
  const handleSort = (property: keyof ComputerRow) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Applique le tri corrigé
  const sortedItems = [...items].sort((a, b) => {
    let aValue: string | number | ComputerRow["assignedTo"] | null | undefined =
      a[orderBy] as string | number | ComputerRow["assignedTo"] | null | undefined;
    let bValue: string | number | ComputerRow["assignedTo"] | null | undefined =
      b[orderBy] as string | number | ComputerRow["assignedTo"] | null | undefined;

    // Si tri sur les dates
    if (orderBy === "createdAt" || orderBy === "assignedAt") {
      const aTime = aValue ? new Date(aValue as string).getTime() : 0;
      const bTime = bValue ? new Date(bValue as string).getTime() : 0;
      return order === "asc" ? aTime - bTime : bTime - aTime;
    }

    // Si tri sur assignedTo (objet)
    if (orderBy === "assignedTo") {
      const aUser = aValue as ComputerRow["assignedTo"];
      const bUser = bValue as ComputerRow["assignedTo"];
      aValue = aUser ? `${aUser.firstName} ${aUser.lastName}` : "";
      bValue = bUser ? `${bUser.firstName} ${bUser.lastName}` : "";
    }

    // Comparaison naturelle pour strings/nombres
    return order === "asc"
      ? String(aValue).localeCompare(String(bValue), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      : String(bValue).localeCompare(String(aValue), undefined, {
          numeric: true,
          sensitivity: "base",
        });
  });

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          CMDB - Ordinateurs
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  if (accessDenied) {
    return (
      <Box>
        <Typography variant="h6" mb={3}>
          Accès refusé
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        CMDB - Ordinateurs
      </Typography>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">Liste des ordinateurs</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Rechercher..."
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchText(e.target.value)
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => (window.location.href = "/cmdb/new-asset")}
            >
              Nouveau
            </Button>
          </Box>
        </Toolbar>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                {[
                  { id: "computerName", label: "Nom" },
                  { id: "serialNumber", label: "Numéro de série" },
                  { id: "assignedTo", label: "Attribué à" },
                  { id: "assignedAt", label: "Attribué le" },
                  { id: "createdAt", label: "Créé le" },
                ].map((col) => (
                  <TableCell {...({ key: col.id } as any)}>
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : "asc"}
                      onClick={() => handleSort(col.id as keyof ComputerRow)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell {...({ colSpan: 5 } as any)}>Aucun ordinateur.</TableCell>
                </TableRow>
              ) : (
                sortedItems.map((c) => {
                  const assignedToLabel = c.assignedTo
                    ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}`
                    : "-";
                  const assignedAtText = c.assignedAt
                    ? new Date(c.assignedAt).toLocaleString()
                    : "-";
                  const createdAtText = c.createdAt
                    ? new Date(c.createdAt).toLocaleString()
                    : "-";

                  return (
                    <TableRow
                      key={c.id}
                      hover
                      onClick={() =>
                        (window.location.href =
                          "/cmdb/asset?id=" + String(c.id))
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell>{c.computerName}</TableCell>
                      <TableCell>{c.serialNumber}</TableCell>
                      <TableCell>{assignedToLabel}</TableCell>
                      <TableCell>{assignedAtText}</TableCell>
                      <TableCell>{createdAtText}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={items.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
          labelRowsPerPage="Lignes par page"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
        />
      </Paper>
    </Box>
  );
}