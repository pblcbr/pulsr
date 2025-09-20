import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Questionnaire from "../components/Questionnaire";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// Simple loading spinner while data fetches
function inlineSpinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );
}


function Onboarding() {
  const [loading, setLoading] = useState(true);        // true while fetching data
  const [questions, setQuestions] = useState(null);    // stores the formatted questions
  const [errorMessage, setErrorMessage] = useState(null); // stores any fetch error

  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleOnboardingComplete(results) {
    if (!user) return;
    try {
      console.log("Received results from questionnaire:", results);

      const { data, error } = await supabase.from("profiles").insert([
        {
          user_id: user.id,
          practical: results.totals.practical,
          creative: results.totals.creative,
          analytical: results.totals.analytical,
          social: results.totals.social,
          entrepreneurial: results.totals.entrepreneurial,
          organized: results.totals.organized,
          business_model: results.business_model,
          audience: results.audience,
          tech_comfort: results.tech_comfort,
          structure_flex: results.structured_flexible,
          solo_team: results.independent_team,
          interest_text: results.topInterests.join(", "),
        },
      ]);

      if (error) {
        console.error("Error saving onboarding results:", error);
        alert("Error al guardar los resultados. Por favor, inténtalo de nuevo.");
      } else {
        console.log("Saved onboarding results:", data);
        // mark as completed in user metadata
        await supabase.auth.updateUser({
          data: { has_completed_onboarding: true },
        });
        alert("¡Onboarding completado! Tu perfil ha sido actualizado.");
        navigate("/profile");
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
        <h1 className="text-xl font-semibold mb-2">Onboarding Questionnaire</h1>
        <p className="text-red-600">Error: {errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Onboarding Questionnaire</h1>
          <p className="text-neutral-500">
            ~5 minutes • one question at a time
          </p>
        </div>

        {(!questions || questions.length === 0) ? (
          <p className="text-center py-12 text-neutral-500">
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
