// src/components/Questionnaire.jsx
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import ProgressBar from "./ProgressBar";
import computeResults from "../utils/computeResults";
import { useAuth } from "../contexts/AuthContext"; 
import ResultsCard from "./ResultsCard";

const MotionDiv = motion.div;

function Questionnaire({ questions, onComplete }) {
  const { user } = useAuth() || {}; // expects { user } 
  const [step, setStep] = useState(0);
  const current = questions[step];
  const total = questions.length;
  const [summary, setSummary] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    watch,
  } = useForm({
    mode: "onChange",
    resolver: undefined,
    defaultValues: {},
  });

  const percent = ((step + 1) / total) * 100;
  const currentValue = watch(current?.key);
  const isAnswered = current?.required ? Boolean(currentValue) : true;

  useEffect(() => {
    const onKey = (e) => {
      if (current?.type === "choice" && current.hotkeys) {
        const idx = current.hotkeys.indexOf(e.key);
        if (idx > -1 && current.options[idx]) {
          setValue(current.key, current.options[idx].id, { shouldValidate: true });
          setTimeout(() => goNext(), 150);
        }
      }
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, current]);

  // ---- AUTH  ----
  if (user === undefined) {
    // context not ready OR you don't expose a loading flag
    return (
      <div className="rounded-xl border p-6 text-center">
        <p>Loading…</p>
      </div>
    );
  }
  if (!user) {
    // not signed in
    return (
      <div className="rounded-xl border p-6 text-center">
        <h2 className="text-lg font-medium mb-2">Please sign in to continue</h2>
        <p className="text-sm text-neutral-600">
          You need an account to take the questionnaire.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-xl bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
        >
          Sign in
        </a>
      </div>
    );
  }
  // -------------------

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function goNext() {
    if (current?.required) {
      const valid = await trigger(current.key);
      if (!valid) return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  }

  function onPick(key, value) {
    setValue(key, value, { shouldValidate: true, shouldDirty: true });
    setTimeout(() => goNext(), 150);
  }

  function onSubmit(values) {
    const resultSummary = computeResults(values, questions);
    setSummary(resultSummary);
    if (onComplete) onComplete(resultSummary);
  }

  const variants = {
    initial: { opacity: 0, x: 40 },
    enter: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
  };

  if (summary) {
    return (
      <MotionDiv
        key="results"
        variants={variants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="rounded-2xl bg-white p-6 shadow-lg"
      >
        <ResultsCard summary={summary} />
      </MotionDiv>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative" aria-live="polite">
      <ProgressBar percent={percent} />

      <AnimatePresence mode="wait" initial={false}>
        <MotionDiv
          key={current.id}
          variants={variants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="rounded-2xl bg-white p-6 shadow-lg"
        >
          <h2 className="text-xl font-medium text-orange-500">{current.title}</h2>

          <div className="mt-6">
            {current.type === "choice" && (
              <Controller
                control={control}
                name={current.key}
                rules={{ required: current.required }}
                render={({ field }) => (
                  <div
                    className={clsx(
                      current.layout === "grid"
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                        : "flex flex-col gap-3"
                    )}
                  >
                    {current.options.map((opt, i) => {
                      const active = field.value === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => onPick(current.key, opt.id)}
                          className={clsx(
                            "group rounded-xl border p-4 text-left transition",
                            active
                              ? "border-orange-500 bg-orange-500 text-white shadow-md"
                              : "border-neutral-200 bg-white hover:border-orange-300"
                          )}
                          aria-pressed={active}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">{opt.label}</span>
                            {current.hotkeys?.[i] && (
                              <span
                                className={clsx(
                                  "ml-3 rounded-md px-2 py-0.5 text-xs",
                                  active ? "bg-white text-orange-500" : "bg-neutral-100 text-neutral-600"
                                )}
                              >
                                {current.hotkeys[i]}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            )}

            {current.type === "slider" && (
              <Controller
                control={control}
                name={current.key}
                rules={{ required: current.required }}
                render={({ field }) => {
                  const currentValue = field.value ?? current.min;
                  const percentage = ((currentValue - current.min) / (current.max - current.min)) * 100;
                  return (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm text-neutral-600">
                        <span>{current.leftLabel}</span>
                        <span>{field.value ?? "—"}</span>
                        <span>{current.rightLabel}</span>
                      </div>
                      <input
                        type="range"
                        min={current.min}
                        max={current.max}
                        value={currentValue}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        style={{
                          background: `linear-gradient(to right, #f97316 0%, #f97316 ${percentage}%, #fed7aa ${percentage}%, #fed7aa 100%)`
                        }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
                        aria-label={current.title}
                      />
                    </div>
                  );
                }}
              />
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className={clsx(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                step === 0
                  ? "cursor-not-allowed opacity-40"
                  : "border-orange-300 text-orange-700 hover:border-orange-400 hover:text-orange-700"
              )}
            >
              Back
            </button>

            {step < total - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!isAnswered}
                className={clsx(
                  "rounded-xl px-5 py-2 text-sm font-medium transition-colors",
                  isAnswered
                    ? "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isAnswered}
                className={clsx(
                  "rounded-xl px-5 py-2 text-sm font-medium transition-colors",
                  isAnswered
                    ? "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                See my results
              </button>
            )}
          </div>
        </MotionDiv>
      </AnimatePresence>

      <div className="mt-6 text-center text-xs text-neutral-500">
        Tip: Use number keys 1–6 • Use ← → to navigate
      </div>
    </form>
  );
}

export default Questionnaire;
