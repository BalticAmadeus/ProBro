import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ProBroButton = styled(Button)({
  variant: "text",
  margin: "10px",
  color: "inherit",
  backgroundColor: "inherit",
  ":disabled": {
    color: "inherit",
    backgroundColor: "inherit",
    opacity: 0.5,
  },
});
