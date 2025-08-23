"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from "@mui/material";

type ComputerRow = {
  id: number;
  computerName: string;
  serialNumber: string;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
  assignedAt?: string | null;
  createdAt?: string | null;
};

export default function CmdbPage() {
  const router = useRouter();

  const [items, setItems] = useState<ComputerRow[]>([]);
  const [total, setTotal] = useState<number>(0);

  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  async function loadComputers() {
    setLoading(true);
    setErrorMessage("");

    try {
      const url =
        "/api/cmdb/computers?search=" +
        encodeURIComponent(searchText) +
        "&page=" +
        String(page) +
        "&pageSize=" +
        String(pageSize);

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          (err && err.error) || "Erreur lors du chargement des ordinateurs.";
        setErrorMessage(msg);
        setItems([]);
        setTotal(0);
      } else {
        const data = await res.json();
        const list: ComputerRow[] = [];
        if (data && Array.isArray(data.items)) {
          for (let i = 0; i < data.items.length; i++) {
            const c = data.items[i];
            list.push({
              id: c.id,
              computerName: c.computerName,
              serialNumber: c.serialNumber,
              assignedTo: c.assignedTo || null,
              assignedAt: c.assignedAt || null,
              createdAt: c.createdAt || null,
            });
          }
        }
        setItems(list);
        if (typeof data.total === "number") {
          setTotal(data.total);
        } else {
          setTotal(0);
        }
      }
    } catch (e) {
      setErrorMessage("Erreur réseau.");
      setItems([]);
      setTotal(0);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadComputers();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        loadComputers();
      }
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [searchText]);

  function goPrev() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  function goNext() {
    const maxPages = Math.ceil(total / pageSize);
    if (page < maxPages) {
      setPage(page + 1);
    }
  }

  function openNew() {
    router.push("/cmdb/new-asset");
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        CMDB — Ordinateurs
      </Typography>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            label="Recherche (nom ou numéro de série)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" color="primary" onClick={openNew}>
              Nouveau
            </Button>
          </Box>
        </Grid>
      </Grid>

      {errorMessage ? (
        <Typography sx={{ mb: 2 }}>{errorMessage}</Typography>
      ) : null}

      <Paper sx={{ width: "100%" }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Numéro de série</TableCell>
                <TableCell>Attribué à</TableCell>
                <TableCell>Attribué le</TableCell>
                <TableCell>Créé le</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Aucun ordinateur.</TableCell>
                </TableRow>
              ) : (
                items.map((c) => {
                  let assignedToLabel = "-";
                  if (c.assignedTo) {
                    assignedToLabel =
                      c.assignedTo.firstName + " " + c.assignedTo.lastName;
                  }
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
                        router.push("/cmdb/asset?id=" + String(c.id))
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
        )}
      </Paper>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={goPrev} disabled={page <= 1}>
          Précédent
        </Button>
        <Typography>
          Page {page} / {Math.max(1, Math.ceil(total / pageSize))}
        </Typography>
        <Button
          variant="outlined"
          onClick={goNext}
          disabled={page >= Math.ceil(total / pageSize)}
        >
          Suivant
        </Button>
        <Typography sx={{ ml: 2 }}>
          {total} élément{total > 1 ? "s" : ""}
        </Typography>
      </Box>
    </Box>
  );
}
