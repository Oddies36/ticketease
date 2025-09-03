"use client";

import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  CssBaseline,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useRouter } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCallIcon from "@mui/icons-material/AddCall";
import GroupsIcon from "@mui/icons-material/Groups";
import BuildIcon from "@mui/icons-material/Build";
import ContactsIcon from "@mui/icons-material/Contacts";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BallotIcon from "@mui/icons-material/Ballot";
import DevicesIcon from "@mui/icons-material/Devices";
import { useUserStore } from "@/app/store/userStore";
import { authRedirect } from "@/app/components/authRedirect";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 240;

/**
 * Layout globale qui protège toutes les pages sous app/(pages)
 * Vérifie l'authentification avec authRedirect
 * Fournit un layout commun
 * Injecte la page courante dans children
 */
export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //Vérifie l'authentification
  const { loading, user } = authRedirect();
  const router = useRouter();
  /**On cherche l'état de l'utilisateur dans le store et on applique clearUser ce qui le met à null
   * Utilisé pour le logout
   */
  const clearUser = useUserStore((state) => state.clearUser);

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  // Drawer pour une version responsive
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearUser();
    router.push("/login");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (!isMdUp) setMobileOpen(false);
  };

  if (loading || !user) return null;

  // Contenu des drawers qui sont shared
  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#6082B6",
        color: "#fff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 64,
          px: 2,
          backgroundColor: "#6082B6",
          borderBottom: "1px solid #5470a3ff",
        }}
      >
        <Box
          component="img"
          src="/TE_logo.png"
          alt="TicketEase logo"
          sx={{
            height: { xs: 100, sm: 100, md: 120 },
            objectFit: "contain",
            maxWidth: "100%",
          }}
        />
      </Box>

      <List sx={{ mt: 1, backgroundColor: "#6082B6", flexGrow: 1 }}>
        <ListItemButton
          onClick={() => handleNavigation("/dashboard")}
          sx={{ mb: "5px" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText
            primary="Home"
            slotProps={{ primary: { sx: { fontSize: 18 } } }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => handleNavigation("/incidents")}
          sx={{ mb: "5px" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <AddCallIcon />
          </ListItemIcon>
          <ListItemText
            primary="Incidents"
            slotProps={{ primary: { sx: { fontSize: 18 } } }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => handleNavigation("/tasks")}
          sx={{ mb: "5px" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText
            primary="Tâches"
            slotProps={{ primary: { sx: { fontSize: 18 } } }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => handleNavigation("/groupes")}
          sx={{ mb: "5px" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <GroupsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Mes groupes"
            slotProps={{ primary: { sx: { fontSize: 18 } } }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => handleNavigation("/outils")}
          sx={{ mb: "5px" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <BuildIcon />
          </ListItemIcon>
          <ListItemText
            primary="Outils"
            slotProps={{ primary: { sx: { fontSize: 18 } } }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => handleNavigation("/cmdb")}
          sx={{ mb: "5px" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DevicesIcon />
          </ListItemIcon>
          <ListItemText
            primary="CMDB"
            slotProps={{ primary: { sx: { fontSize: 18 } } }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => handleNavigation("/mes-tickets")}
          sx={{ mb: "5px" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <BallotIcon />
          </ListItemIcon>
          <ListItemText
            primary="Mes tickets"
            slotProps={{ primary: { sx: { fontSize: 18 } } }}
          />
        </ListItemButton>
        <ListItemButton onClick={() => handleNavigation("/annuaire")}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <ContactsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Annuaire"
            slotProps={{ primary: { sx: { fontSize: 18 } } }}
          />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="sidebar"
      >
        {/* Drawer responsive */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#6082B6",
              color: "#fff",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Drawer desktop */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#6082B6",
              color: "#fff",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          position="fixed"
          sx={{
            width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
            ml: { xs: 0, md: `${drawerWidth}px` },
            backgroundColor: "#fff",
            color: "#000",
            boxShadow: "none",
            height: 64,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Toolbar sx={{ minHeight: 64 }}>
            {/* Bouton seulement pour responsive */}
            <IconButton
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.firstName} {user?.lastName}
            </Typography>
            <Button
              onClick={handleLogout}
              color="inherit"
              startIcon={<LogoutIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Déconnexion
            </Button>
          </Toolbar>
        </AppBar>

        {/* contenu des pages */}
        <Box component="main" sx={{ mt: 8, p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
