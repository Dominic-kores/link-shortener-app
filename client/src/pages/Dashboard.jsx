
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Link2,
  Copy,
  QrCode,
  BarChart3,
  Trash2,
  Upload,
} from "lucide-react";

import { api, message } from "../lib/api";
import Pagination from "../components/Pagination";
import QRCodeModal from "../components/QRCodeModal";

export default function Dashboard() {
  // Form values for creating a shortened link.
  const [fields, setFields] = useState({
    originalUrl: "",
    customCode: "",
    expiresAt: "",
  });

  // Saved links and pagination.
  const [links, setLinks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLinks, setTotalLinks] = useState(0);

  // Loading and submission states.
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Feedback and QR modal.
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [qrUrl, setQrUrl] = useState(null);

  // Load links for the current page.
  const loadLinks = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get("/links", {
        params: { page },
      });

      setLinks(data.links);
      setTotalPages(data.totalPages);
      setTotalLinks(data.total);
      setError("");
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Fetch links whenever the page changes.
  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // Update fields in the create-link form.
  function handleChange(e) {
    const { name, value } = e.target;

    setFields((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Create a new shortened link.
  async function handleCreate(e) {
    e.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api.post("/links", {
        originalUrl: fields.originalUrl,

        // Empty string lets the server generate a code.
        customCode: fields.customCode.trim(),

        // Convert a local date/time to UTC ISO format.
        expiresAt: fields.expiresAt
          ? new Date(fields.expiresAt).toISOString()
          : null,
      });

      // Clear form after successful creation.
      setFields({
        originalUrl: "",
        customCode: "",
        expiresAt: "",
      });

      setNotice("Short link created successfully!");

      // Refresh the listing.
      if (page === 1) {
        await loadLinks();
      } else {
        setPage(1);
      }
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  // Copy a shortened URL to the clipboard.
  async function handleCopy(url) {
    try {
      await navigator.clipboard.writeText(url);

      setNotice("Short URL copied to clipboard!");
      setError("");
    } catch {
      setError(
        "Unable to copy automatically. Copy the link manually."
      );
    }
  }

  // Delete a link owned by the current user.
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Delete this link and all its click analytics?"
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/links/${id}`);

      setNotice("Link deleted successfully.");

      // Move back if we deleted the last link on a page.
      if (links.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadLinks();
      }
    } catch (err) {
      setError(message(err));
    }
  }

  // Upload CSV to create multiple shortened links.
  async function handleBulkUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      // Read CSV contents.
      const csv = await file.text();

      // Backend accepts CSV as a JSON string.
      const { data } = await api.post(
        "/links/bulk",
        { csv },
        { responseType: "blob" }
      );

      // Download the resulting CSV file.
      const objectUrl = URL.createObjectURL(
        new Blob([data], {
          type: "text/csv;charset=utf-8",
        })
      );

      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = "shortened-links.csv";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      // Release the temporary browser object URL.
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);

      setNotice(
        "Bulk links created. CSV results downloaded."
      );

      if (page === 1) {
        await loadLinks();
      } else {
        setPage(1);
      }
    } catch (err) {
      // Blob responses require additional parsing
      // if displaying the server's exact JSON error.
      let errorText = "Bulk upload failed.";

      if (err.response?.data instanceof Blob) {
        try {
          const response = JSON.parse(
            await err.response.data.text()
          );

          errorText = response.error || errorText;
        } catch {
          // Keep the fallback error.
        }
      } else {
        errorText = message(err);
      }

      setError(errorText);
    } finally {
      setBusy(false);

      // Allow the same file to be uploaded again.
      e.target.value = "";
    }
  }

  // Total clicks across the visible page.
  const pageClicks = links.reduce(
    (total, link) => total + link.clicks,
    0
  );

  return (
    <div className="space-y-7">

      {/* Dashboard header */}
      <div>
        <h1 className="text-3xl font-bold">
          My Links Dashboard
        </h1>

        <p className="text-slate-500 mt-1">
          Create, manage and track shortened URLs.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-100">
            <Link2 className="text-indigo-600" />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Total Links
            </p>

            <h2 className="text-3xl font-bold">
              {totalLinks}
            </h2>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-100">
            <BarChart3 className="text-green-600" />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Clicks on Current Page
            </p>

            <h2 className="text-3xl font-bold">
              {pageClicks}
            </h2>
          </div>
        </div>
      </div>

      {/* URL creation form */}
      <section className="card">
        <h2 className="text-xl font-bold mb-4">
          Create a Short Link
        </h2>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="sm:col-span-2">
            <label htmlFor="originalUrl">
              Original URL
            </label>

            <input
              id="originalUrl"
              name="originalUrl"
              type="url"
              placeholder="https://example.com/very-long-url"
              value={fields.originalUrl}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="customCode">
              Custom Short Code (Optional)
            </label>

            <input
              id="customCode"
              name="customCode"
              type="text"
              placeholder="my-link"
              pattern="[a-zA-Z0-9-]{3,20}"
              title="3–20 letters, numbers or hyphens"
              value={fields.customCode}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="expiresAt">
              Expiration Date (Optional)
            </label>

            <input
              id="expiresAt"
              name="expiresAt"
              type="datetime-local"
              value={fields.expiresAt}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn sm:col-span-2"
            disabled={busy}
          >
            {busy ? "Processing..." : "Shorten URL"}
          </button>
        </form>
      </section>

      {/* CSV file upload */}
      <section className="card">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="text-indigo-600" />

          <h2 className="text-xl font-bold">
            Bulk Link Creation
          </h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Upload a CSV containing up to 100 URLs.
          Use the column header originalUrl.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleBulkUpload}
          disabled={busy}
        />
      </section>

      {/* Feedback messages */}
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg"
        >
          {notice}
        </div>
      )}

      {/* Saved links */}
      <section className="card">
        <h2 className="text-xl font-bold mb-5">
          Your Shortened URLs
        </h2>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 bg-slate-200 rounded-lg"
              />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-12">
            <Link2
              size={40}
              className="mx-auto text-slate-400 mb-3"
            />

            <p className="text-slate-500">
              No links found. Create your first
              shortened URL above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
              >
                {/* Link information */}
                <div className="min-w-0">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-indigo-600 hover:underline break-all"
                  >
                    {link.shortUrl}
                  </a>

                  <p
                    className="text-sm text-slate-500 truncate mt-1"
                    title={link.originalUrl}
                  >
                    {link.originalUrl}
                  </p>

                  <p className="text-sm text-slate-600 mt-2">
                    {link.clicks} clicks
                  </p>

                  {link.expiresAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(link.expiresAt) <= new Date()
                        ? "Expired"
                        : `Expires: ${new Date(
                            link.expiresAt
                          ).toLocaleString()}`}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() =>
                      handleCopy(link.shortUrl)
                    }
                  >
                    <Copy size={16} />
                    Copy
                  </button>

                  <button
                    type="button"
                    className="action-btn"
                    onClick={() =>
                      setQrUrl(link.shortUrl)
                    }
                  >
                    <QrCode size={16} />
                    QR
                  </button>

                  <Link
                    to={`/links/${link.id}`}
                    className="action-btn"
                  >
                    <BarChart3 size={16} />
                    Analytics
                  </Link>

                  <button
                    type="button"
                    className="action-btn text-red-600 border-red-200"
                    onClick={() =>
                      handleDelete(link.id)
                    }
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPage={setPage}
          />
        )}
      </section>

      {/* QR code modal */}
      {qrUrl && (
        <QRCodeModal
          url={qrUrl}
          onClose={() => setQrUrl(null)}
        />
      )}
    </div>
  );
}
