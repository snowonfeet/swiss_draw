import { Backdrop } from "@mui/material";
import { FC } from "react";
import QRCode from "./qrcode";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string;
};

export const QRBackdroop: FC<Props> = ({ open, onClose, url }) => {
  return (
    <Backdrop open={open} onClick={onClose}>
      <QRCode url={url} size={256} />
    </Backdrop>
  )
};
