
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeModal({ url, onClose }) {
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Generate QR code from the shortened URL.
    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
    })
      .then(setImage)
      .catch(() => setError("QR generation failed"));
  }, [url]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Short link QR code"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <div className="card max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-3">
          Your QR Code
        </h2>

        <p className="text-sm text-slate-500 break-all">
          {url}
        </p>

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        {image && (
          <>
            <img
              src={image}
              alt={`QR code for ${url}`}
              className="mx-auto my-5"
            />

            <a
              href={image}
              download="short-link-qr.png"
              className="btn inline-block"
            >
              Download QR Code
            </a>
          </>
        )}

        <button
          onClick={onClose}
          className="block mx-auto mt-5 text-slate-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
