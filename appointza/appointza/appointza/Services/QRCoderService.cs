using QRCoder;


namespace appointza.Services
{
    public class QRCoderService
    {
        public byte[] GenerateQRCodeAsByteArray(string text)
        {
            using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
            {
                QRCodeData qrCodeData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);
                using (PngByteQRCode qrCode = new PngByteQRCode(qrCodeData))
                {
                    return qrCode.GetGraphic(20); // Generate the QR code as a PNG byte array
                }
            }
        }
    }
}
