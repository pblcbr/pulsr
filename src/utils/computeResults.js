function addWeights(acc, weights) {
    if (!weights) return acc;
    Object.keys(weights).forEach((k) => {
      acc[k] = (acc[k] || 0) + (weights[k] || 0);
    });
    return acc;
  }
  
  function computeResults(values, QUESTIONS) {
    const totals = {
      practical: 0,
      analytical: 0,
      creative: 0,
      social: 0,
      entrepreneurial: 0,
      organized: 0,
    };
  
    let business_model;
    let audience;
  
    QUESTIONS.forEach((q) => {
      if (q.type === "choice") {
        const picked = q.options.find((o) => o.id === values[q.key]);
        addWeights(totals, picked && picked.weights);
        if (picked && picked.flags && picked.flags.business_model) business_model = picked.flags.business_model;
        if (picked && picked.flags && picked.flags.audience) audience = picked.flags.audience;
      }
    });
  
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const top1 = sorted[0] && sorted[0][0];
    const top2 = sorted[1] && sorted[1][0];
  
    return {
      totals,
      topInterests: [top1, top2],
      business_model: business_model || "—",
      audience: audience || "—",
      tech_comfort: values.tech_comfort ?? null,
      structured_flexible: values.structured_flexible ?? null,
      independent_team: values.independent_team ?? null,
    };
  }
  
  export default computeResults;