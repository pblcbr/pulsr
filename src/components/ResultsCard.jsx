import React, { useState } from "react";
import clsx from "clsx";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function ResultsCard({ summary }) {
  const { user } = useAuth();
  const { topInterests, business_model, audience, tech_comfort, structured_flexible, independent_team, totals } = summary;

  const [writingInterests, setWritingInterests] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSave() {
    if (!user) return; // not logged in, shouldn’t happen here
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ interest_text: writingInterests }) // 👈 Using existing `interest_text` column
        .eq("user_id", user.id);

      if (error) throw error;
      setSaved(true);
      console.log("navigating to dashboard")
      navigate('/dashboard');
    } catch (err) {
      setError("Failed to save. Please try again.");
      console.error("Error saving writing interests:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Your Results</h2>

      {/* Top Interests */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Top Interests</h3>
        <div className="flex gap-2 flex-wrap">
          {topInterests.map((interest, i) => (
            <span
              key={i}
              className="rounded-full bg-orange-500 text-white px-3 py-1 text-sm"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Business Model / Audience */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border p-4">
          <h4 className="text-sm text-neutral-500">Business Model</h4>
          <p className="text-lg font-medium">{business_model}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h4 className="text-sm text-neutral-500">Audience</h4>
          <p className="text-lg font-medium">{audience}</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border p-4">
          <h4 className="text-sm text-neutral-500">Tech Comfort</h4>
          <p className="text-lg font-medium">{tech_comfort ?? "—"}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h4 className="text-sm text-neutral-500">Structure vs Flex</h4>
          <p className="text-lg font-medium">{structured_flexible ?? "—"}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h4 className="text-sm text-neutral-500">Solo vs Team</h4>
          <p className="text-lg font-medium">{independent_team ?? "—"}</p>
        </div>
      </div>

      {/* Totals visualization */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Scores</h3>
        <div className="space-y-2">
          {Object.entries(totals).map(([trait, value]) => (
            <div key={trait}>
              <div className="flex justify-between text-sm text-neutral-600">
                <span className="capitalize">{trait}</span>
                <span>{value}</span>
              </div>
              <div className="h-2 w-full rounded bg-neutral-200 overflow-hidden">
                <div
                  className={clsx("h-2 bg-orange-500")}
                  style={{ width: `${Math.min(value * 20, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Writing Interests Input */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">
          What topics are you most excited to write about?
        </h3>
        <textarea
          rows={4}
          value={writingInterests}
          onChange={(e) => setWritingInterests(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 p-3 focus:ring-2 focus:ring-orange-500"
          placeholder="e.g. tech trends, personal growth, entrepreneurship..."
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 px-5 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 hover:shadow-md disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Interests"}
        </button>

        {saved && <p className="text-green-600 mt-2">Saved successfully 🎉</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default ResultsCard;