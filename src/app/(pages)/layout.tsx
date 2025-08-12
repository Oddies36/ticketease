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
import NotificationsIcon from "@mui/icons-material/Notifications";
import EmailIcon from "@mui/icons-material/Email";
import { useUserStore } from "@/app/store/userStore";
import { authRedirect } from "@/app/components/authRedirect";

const drawerWidth = 240;

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = authRedirect();
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  // mobile drawer open/close
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

  // shared drawer contents
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
            primary="Incident"
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
            primary="Task"
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

      {/* Temporary drawer on xs/sm, permanent on md+ */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="sidebar"
      >
        {/* Mobile drawer */}
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

        {/* Desktop drawer */}
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
            {/* Menu button only on mobile */}
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
            <IconButton>
              <NotificationsIcon />
            </IconButton>
            <IconButton>
              <EmailIcon />
            </IconButton>
            <Button onClick={handleLogout}>Déconnexion</Button>
          </Toolbar>
        </AppBar>

        {/* content */}
        <Box component="main" sx={{ mt: 8, p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
