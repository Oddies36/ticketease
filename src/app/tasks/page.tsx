import React from "react";
import { LayoutComponent } from "@/app/components/layout";
import { Typography, Box } from "@mui/material";

const Tasks: React.FC = () => {
  return (
    <LayoutComponent>
      <Box>
        <Typography variant="h4">Tasks</Typography>
        
      </Box>
    </LayoutComponent>
  );
};

export default Tasks;