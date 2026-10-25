
import { useEffect, useState } from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { api, message } from "../lib/api";

// Chart colours.
const COLORS = [
  "#4f46e5",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#7c3aed",
];

export default function LinkStats() {
  // Read the link ID from React Router.
  const { id } = useParams();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch link analytics from the Express API.
  useEffect(() => {
    let active = true;

    async function fetchAnalytics() {
      try {
        const { data } = await api.get(
          `/links/${id}/stats`
        );

        if (active) {
          setStats(data);
        }
      } catch (err) {
        if (active) {
          setError(message(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      active = false;
    };
  }, [id]);

  // Show a loading state while data is fetched.
  if (loading) {
    return (
      <div className="card text-center">
        Loading analytics...
      </div>
    );
  }

  // Display API errors.
  if (error) {
    return (
      <div className="card">
        <p role="alert" className="error mb-3">
          {error}
        </p>

        <Link
          to="/"
          className="text-indigo-600"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-center">
        No analytics available.
      </p>
    );
  }

  // Destructure analytics from the API response.
  const {
    link,
    clicksOverTime,
    browsers,
    referrers,
  } = stats;

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        to="/"
        className="inline-block text-indigo-600 font-medium hover:underline"
      >
        ← Back to Dashboard
      </Link>

      {/* Link overview */}
      <section className="card">
        <h1 className="text-3xl font-bold mb-4">
          Link Analytics
        </h1>

        <p className="text-sm text-slate-500">
          Shortened URL
        </p>

        <a
          href={link.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 break-all font-medium"
        >
          {link.shortUrl}
        </a>

        <p className="text-sm text-slate-500 mt-4">
          Original URL
        </p>

        <p className="break-all">
          {link.originalUrl}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-600">
              Total Clicks
            </p>

            <h2 className="text-3xl font-bold">
              {link.clicks}
            </h2>
          </div>

          <div className="bg-slate-100 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Last Clicked
            </p>

            <p className="font-semibold mt-2">
              {link.lastClicked
                ? new Date(
                    link.lastClicked
                  ).toLocaleString()
                : "Never"}
            </p>
          </div>
        </div>
      </section>

      {/* Seven-day click trends */}
      <section className="card">
        <h2 className="text-xl font-bold mb-4">
          Clicks Over Time
        </h2>

        <p className="text-sm text-slate-500 mb-5">
          Daily clicks over the last seven UTC days.
        </p>

        <div className="h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart data={clicksOverTime}>
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#4f46e5"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Browser and referrer charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Browser pie chart */}
        <section className="card">
          <h2 className="text-xl font-bold mb-4">
            Browser Breakdown
          </h2>

          {browsers.length === 0 ? (
            <p className="text-slate-500">
              No browser data yet.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={browsers}
                    dataKey="count"
                    nameKey="name"
                    outerRadius={85}
                    label
                  >
                    {browsers.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={
                          COLORS[
                            index % COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Referrer bar chart */}
        <section className="card">
          <h2 className="text-xl font-bold mb-4">
            Top Referrers
          </h2>

          {referrers.length === 0 ? (
            <p className="text-slate-500">
              No referrer data yet.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={referrers}
                  layout="vertical"
                  margin={{
                    left: 15,
                    right: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={95}
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#059669"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
