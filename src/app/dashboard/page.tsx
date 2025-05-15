"use client";

import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Stack,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  CssBaseline,
  Avatar,
  IconButton as MuiIconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCallIcon from "@mui/icons-material/AddCall";
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NotificationsIcon from "@mui/icons-material/Notifications";
import EmailIcon from "@mui/icons-material/Email";

const drawerWidth = 240;

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
  borderRadius: theme.shape.borderRadius,
}));

const Dashboard: React.FC = () => {
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
            backgroundColor: "#303C52",
            color: "#fff",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
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
            backgroundColor: "#303C52",
          }}
        >
          <Typography variant="h6" sx={{ color: "#fff" }}>
            TicketEase
          </Typography>
        </Box>
        <List sx={{ backgroundColor: "#3C4C63" }}>
          <ListItemButton
            sx={{
              height: "64px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon>
              <AddCallIcon />
            </ListItemIcon>
            <ListItemText primary="Incident" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Task" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon>
              <GroupsIcon />
            </ListItemIcon>
            <ListItemText primary="Mes groupes" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, backgroundColor: "#f4f5f7", minHeight: "100vh" }}>
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
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1 }}
            >
              Page d'accueil
            </Typography>
            <IconButton>
              <NotificationsIcon />
            </IconButton>
            <IconButton>
              <EmailIcon />
            </IconButton>
            <Avatar src="/profile.jpg" />
          </Toolbar>
        </AppBar>
      </Box>
    </Box>
  );
};

export default Dashboard;
