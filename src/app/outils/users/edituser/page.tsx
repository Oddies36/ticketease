import React from "react";
import { LayoutComponent } from "@/app/components/layout";
import { Typography, Box, Card, CardContent, CardActions, Button, Grid } from "@mui/material";

const Edituser: React.FC = () => {
  return (
    <LayoutComponent>
      <Box>
        <Typography variant="h4" mb={3}>Modification d'un utilisateur</Typography>
      </Box>
    </LayoutComponent>
  );
};

export default Edituser;