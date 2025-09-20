import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Questionnaire from "../components/Questionnaire";
import { supabase } from "../lib/supabase";
import { saveOnboardingResults } from "../services/profileService";

// Simple loading spinner while data fetches
function inlineSpinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );
}

/**
 * Convert Supabase rows into the exact format
 * that our <Questionnaire /> component expects.
 */
function mapDatabaseRowsToQuestions({ questionRows, choiceRows, sliderRows }) {
  return questionRows
    .sort((a, b) => a.ordinal - b.ordinal) // sort by question order
    .map((question) => {
      const questionKey = question.id; // use the database question id as the key

      if (question.type === "slider") {
        const sliderConfig = sliderRows.find(
          (slider) => slider.question_id === question.id
        ) || {};

        return {
          id: question.id,
          type: "slider",
          key: questionKey,
          title: question.prompt,
          leftLabel: sliderConfig.meaning_low || "Low",
          rightLabel: sliderConfig.meaning_high || "High",
          min: sliderConfig.min_value ?? 1,
          max: sliderConfig.max_value ?? 5,
          propertyKey: sliderConfig.property_key || "slider_value",
          required: question.is_required ?? true,
        };
      }

      // For multiple choice or scenario-based questions
      const matchingChoices = choiceRows
        .filter((choice) => choice.question_id === question.id)
        .map((choice) => ({
          id: choice.label || choice.id, // letter label like A, B, C or fallback to id
          label: choice.text,
          weights: choice.interest_weights || {},
          flags: choice.flags || {},
        }));

      return {
        id: question.id,
        type: "choice",
        key: questionKey,
        title: question.prompt,
        options: matchingChoices,
        layout: "grid",
        required: question.is_required ?? true,
        hotkeys: ["1", "2", "3", "4", "5", "6"].slice(0, matchingChoices.length),
      };
    });
}

function Onboarding() {
  const [loading, setLoading] = useState(true);        // true while fetching data
  const [questions, setQuestions] = useState(null);    // stores the formatted questions
  const [errorMessage, setErrorMessage] = useState(null); // stores any fetch error

  useEffect(() => {
  let cancelled = false;

  async function loadQuestionsFromSupabase() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data: rows, error } = await supabase
        .from("onboarding_questions")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!rows || rows.length === 0) {
        throw new Error("No onboarding questions found.");
      }

      // 🔑 Transform Supabase rows into Questionnaire format
      const formatted = rows.map((q, i) => {
        if (q.type === "slider") {
          return {
            id: q.id,
            key: q.key,
            type: "slider",
            title: q.title,
            min: q.definition?.min ?? 1,
            max: q.definition?.max ?? 5,
            leftLabel: q.definition?.meaning_low ?? "Low",
            rightLabel: q.definition?.meaning_high ?? "High",
            required: q.required ?? false,
          };
        } else {
          // assume "choice" type
          const options = (q.definition?.options ?? []).map((opt, index) => ({
            id: opt.id ?? index,
            label: opt.label ?? `Option ${index+1}`,
            weights: opt.weights ?? {},
            flags: opt.flags ?? {},
          }));

          return {
            id: q.id,
            key: q.key,
            type: "choice",
            title: q.title,
            options,
            layout: q.layout || "grid",
            required: q.required ?? false,
            hotkeys: ["1","2","3","4","5","6"].slice(0, options.length),
          };
        }
      });

      if (!cancelled) {
        console.log("Formatted onboarding questions:", formatted);
        setQuestions(formatted);
      }

    } catch (err) {
      if (!cancelled) {
        console.error("Onboarding fetch error:", err);
        setErrorMessage(err.message);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadQuestionsFromSupabase();
  return () => { cancelled = true };
}, []);

  const navigate = useNavigate();

  /**
   * Called when the user completes the questionnaire
   */
  async function handleComplete(summary) {
    try {
      // Guardar resultados en la base de datos
      await saveOnboardingResults(summary);
      
      // Mostrar mensaje de éxito
      alert("¡Onboarding completado! Tu perfil ha sido actualizado.");
      
      // Redirigir al perfil del usuario
      navigate("/profile");
    } catch (error) {
      console.error("Error saving onboarding results:", error);
      alert("Error al guardar los resultados. Por favor, inténtalo de nuevo.");
    }
  }

  // Show loading spinner while fetching data
  if (loading) return inlineSpinner();

  // Show error if fetch failed
  if (errorMessage) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-semibold mb-2">Onboarding Questionnaire</h1>
        <p className="text-red-600">Error: {errorMessage}</p>
      </div>
    );
  }

  // Render questionnaire once questions are ready
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
                <Questionnaire
                questions={questions}
                onComplete={handleComplete}
                />
            )}

      </div>
    </div>
  );
}

export default Onboarding;
