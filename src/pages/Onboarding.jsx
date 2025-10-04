import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Questionnaire from "../components/Questionnaire";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// Simple loading spinner while data fetches
function inlineSpinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );
}


function Onboarding() {
  const [loading, setLoading] = useState(true);        // true while fetching data
  const [questions, setQuestions] = useState(null);    // stores the formatted questions
  const [errorMessage, setErrorMessage] = useState(null); // stores any fetch error

  const { user, markOnboardingComplete } = useAuth();
  const navigate = useNavigate();

  async function handleOnboardingComplete(results) {
    if (!user) return navigate('/login');
    try {
      console.log("Received results from questionnaire:", results);

      const payload = {
        user_id: user.id,
        practical: results.totals?.practical ?? 0,
        analytical: results.totals?.analytical ?? 0,
        creative: results.totals?.creative ?? 0,
        social: results.totals?.social ?? 0,
        entrepreneurial: results.totals?.entrepreneurial ?? 0,
        organized: results.totals?.organized ?? 0,

        business_model: results.business_model ?? '',
        audience: results.audience ?? '',
        positioning_statement: results.positioning_statement ?? '',

        tech_comfort: results.tech_comfort ?? null,
        structure_flex: results.structure_flex ?? results.structured_flexible ?? null,
        solo_team: results.solo_team ?? results.independent_team ?? null,

        interest_text: results.interest_text ??
          (Array.isArray(results.topInterests) ? results.topInterests.join(", ") : ''),

        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error("Error saving onboarding results:", error);
        alert("Error saving your results. Please try again.");
      } else {
        console.log("Saved onboarding results:", data);

        try {
          await supabase.auth.updateUser({
            data: { has_completed_onboarding: true },
          });
          if (typeof markOnboardingComplete === 'function') {
            await markOnboardingComplete();
          }
        } catch (metaErr) {
          console.warn("Unable to update auth metadata:", metaErr);
        }
      }
    } catch (err) {
      console.error("Unexpected error saving onboarding results:", err);
    }
  }

  useEffect(() => {
    setLoading(true);
    setErrorMessage(null);

    async function loadQuestions() {
      try {
        // Load questions from JSON file using dynamic import
        const questionsModule = await import("../data/questions.json");
        const questionsData = questionsModule.default || questionsModule;
        console.log("Loaded questions from JSON:", questionsData);
        setQuestions(questionsData);
      } catch (err) {
        console.error("Error loading questions:", err);
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  if (loading) return inlineSpinner();
  if (errorMessage) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-semibold text-orange-500 mb-2">Onboarding Questionnaire</h1>
        <p className="text-red-500">Error: {errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-orange-500">Onboarding Questionnaire</h1>
          <p className="text-gray-600">
            ~5 minutes • one question at a time
          </p>
        </div>

        {(!questions || questions.length === 0) ? (
          <p className="text-center py-12 text-gray-500">
            No questions available.
          </p>
        ) : (
          <Questionnaire questions={questions} onComplete={handleOnboardingComplete} />
        )}
      </div>
    </div>
  );
}

export default Onboarding;
