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
import { useRouter } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCallIcon from "@mui/icons-material/AddCall";
import GroupsIcon from "@mui/icons-material/Groups";
import BuildIcon from "@mui/icons-material/Build";
import AssignmentIcon from "@mui/icons-material/Assignment";
import NotificationsIcon from "@mui/icons-material/Notifications";
import EmailIcon from "@mui/icons-material/Email";
import { useUserStore } from "@/app/store/userStore";
import { authRedirect } from "@/app/components/authRedirect";

const drawerWidth = 240;

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = authRedirect();
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearUser();
    router.push("/login");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (loading || !user) {
    return null;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          height: "100vh",
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#6082B6",
            color: "#fff",
            height: "100vh",
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "64px",
            px: 2,
            backgroundColor: "#6082B6",
          }}
        >
          <Typography variant="h6" sx={{ color: "#fff" }}>
            TicketEase
          </Typography>
        </Box>
        <List sx={{ backgroundColor: "#6082B6" }}>
          <ListItemButton onClick={() => handleNavigation("/dashboard")}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigation("/incidents")}>
            <ListItemIcon>
              <AddCallIcon />
            </ListItemIcon>
            <ListItemText primary="Incident" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigation("/tasks")}>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Task" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigation("/groupes")}>
            <ListItemIcon>
              <GroupsIcon />
            </ListItemIcon>
            <ListItemText primary="Mes groupes" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigation("/outils")}>
            <ListItemIcon>
              <BuildIcon />
            </ListItemIcon>
            <ListItemText primary="Outils" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
            backgroundColor: "#fff",
            color: "#000",
            boxShadow: "none",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {user?.firstName}
            </Typography>
            <IconButton>
              <NotificationsIcon />
            </IconButton>
            <IconButton>
              <EmailIcon />
            </IconButton>
            <Button onClick={handleLogout}>Déconnexion</Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ mt: 8, p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
