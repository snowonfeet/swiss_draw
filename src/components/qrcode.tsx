import { QRCodeCanvas } from "qrcode.react";
import { FC } from "react";

interface QRCodeProps {
    url: string
    size: number
}

const QRCode: FC<QRCodeProps> = ({ url, size }) => {
    return (
        <QRCodeCanvas
            value={url}
            size={size}
        />
    )
}

export default QRCode;