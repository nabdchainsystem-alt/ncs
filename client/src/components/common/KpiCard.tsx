import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

interface KpiCardProps {
  label: string;
  value: number | null | undefined;
  unit?: string;
  color?: string; // optional for highlight
  hint?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, unit, color, hint }) => {
  const displayValue =
    value === null || value === undefined || Number.isFinite(value) === false
      ? "-"
      : value;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        backgroundColor: "#fff",
        textAlign: "center",
      }}
    >
      <CardContent>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 500, color: "text.secondary", mb: 0.5 }}
        >
          {label}
        </Typography>
        <Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              color: color || "text.primary",
            }}
          >
            {displayValue}
            {displayValue !== "-" && unit ? ` ${unit}` : ""}
          </Typography>
          {hint && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mt: 0.5, display: "block" }}
            >
              {hint}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KpiCard;