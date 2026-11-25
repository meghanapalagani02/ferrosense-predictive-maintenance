import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  GLOBAL_FEATURE_IMPORTANCE,
  MODEL_COMPARISON_DATA,
  PR_CURVE_POINTS,
  ROC_CURVE_POINTS,
} from '../lib/fleetData';

export const ModelInsights: React.FC = () => {
  const pipelineStages = [
    {
      num: '01',
      title: 'AI4I 2020 Dataset',
      detail: '10,000 synthetic-industrial cycles across 5 physical failure signatures.',
    },
    {
      num: '02',
      title: 'Preprocessing',
      detail: 'Outlier validation, unit normalization (K, rpm, Nm), and ordinal encoding of L/M/H tiers.',
    },
    {
      num: '03',
      title: 'Feature Engineering',
      detail: 'Derived ΔT (process − air), Shaft Power (τ · ω), and Strain (toolWear × torque).',
    },
    {
      num: '04',
      title: 'SMOTE Balancing',
      detail: 'Synthetic Minority Oversampling addresses the 3.4% failure-class imbalance.',
    },
    {
      num: '05',
      title: 'XGBoost Training',
      detail: 'Gradient-boosted trees tuned via 5-fold stratified CV for recall-critical triage.',
    },
    {
      num: '06',
      title: 'Calibration & SHAP',
      detail: 'Probability calibration + TreeSHAP attribution exported to FerroSense inference.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
            ML Benchmark &amp; Explainability
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
            Model Insights
          </h1>
        </div>
        <p className="rounded-xl border border-[#8B79C2]/50 bg-[#FBF8F2] px-4 py-2 text-xs font-medium text-[#5E4B9A] dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#E6FF3D]">
          Demonstration values representative of the trained model · Last retrained: 2026-11-24 02:15 UTC
        </p>
      </div>

      {/* Model Comparison Table */}
      <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
        <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
          Architecture Comparison
        </h2>
        <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
          XGBoost is selected for production inference due to highest recall and ROC-AUC on rare
          failure events.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E4DACB] text-xs text-[#5E4B9A] dark:border-[#3E3163] dark:text-[#C5B8E6]">
                <th className="py-3 pr-4 font-semibold">Model</th>
                <th className="px-4 py-3 text-right font-semibold">Accuracy</th>
                <th className="px-4 py-3 text-right font-semibold">Precision</th>
                <th className="px-4 py-3 text-right font-semibold">Recall</th>
                <th className="px-4 py-3 text-right font-semibold">F1 Score</th>
                <th className="pl-4 py-3 text-right font-semibold">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DACB] dark:divide-[#3E3163]">
              {MODEL_COMPARISON_DATA.map((row) => (
                <tr
                  key={row.model}
                  className={
                    row.selected
                      ? 'bg-[#231A3B] text-[#FBF8F2] dark:bg-[#19122B]'
                      : 'text-[#231A3B] hover:bg-[#F4EEE4]/60 dark:text-[#F4EEE4] dark:hover:bg-[#1E1635]'
                  }
                >
                  <td className="py-3.5 pr-4 font-display font-bold">
                    <span className={row.selected ? 'text-[#E6FF3D]' : 'text-[#231A3B] dark:text-[#F4EEE4]'}>
                      {row.model}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                    {row.accuracy.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                    {row.precision.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                    {row.recall.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                    {row.f1.toFixed(1)}%
                  </td>
                  <td className="pl-4 py-3.5 text-right font-mono font-bold tabular-nums">
                    {row.rocAuc.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix + Global Feature Importance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-5 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              XGBoost Confusion Matrix
            </h2>
            <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
              Holdout test set (n = 2,000 cycles)
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
              <div />
              <div className="py-1 font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">Pred: Healthy</div>
              <div className="py-1 font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">Pred: Failure</div>

              <div className="flex items-center justify-end pr-2 font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
                Actual: Healthy
              </div>
              <div className="rounded-xl bg-[#E6FF3D] p-5 text-[#231A3B]">
                <span className="block font-mono text-2xl font-bold tabular-nums">1,921</span>
                <span className="text-[11px] font-semibold">True Negative</span>
              </div>
              <div className="rounded-xl bg-[#8B79C2]/25 p-5 text-[#231A3B] dark:text-[#F4EEE4]">
                <span className="block font-mono text-2xl font-bold tabular-nums">11</span>
                <span className="text-[11px] font-semibold">False Positive</span>
              </div>

              <div className="flex items-center justify-end pr-2 font-semibold text-[#5E4B9A] dark:text-[#C5B8E6]">
                Actual: Failure
              </div>
              <div className="rounded-xl bg-[#B3265E]/15 p-5 text-[#B3265E]">
                <span className="block font-mono text-2xl font-bold tabular-nums">5</span>
                <span className="text-[11px] font-semibold">False Negative</span>
              </div>
              <div className="rounded-xl bg-[#231A3B] p-5 text-[#FBF8F2] dark:bg-[#19122B]">
                <span className="block font-mono text-2xl font-bold text-[#E6FF3D] tabular-nums">
                  63
                </span>
                <span className="text-[11px] font-semibold">True Positive</span>
              </div>
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: Only 5 missed failures out of 68 actual faults yields 92.6% holdout recall with
            a 0.57% false-alarm rate.
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-7 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              Global Feature Importance
            </h2>
            <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
              Mean absolute SHAP gain across engineered physical interactions
            </p>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={GLOBAL_FEATURE_IMPORTANCE}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DACB" strokeOpacity={0.45} horizontal={false} />
                  <XAxis type="number" unit="%" tick={{ fill: '#8B79C2', fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    width={185}
                    tick={{ fill: '#8B79C2', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Importance']}
                    contentStyle={{
                      backgroundColor: '#231A3B',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#FBF8F2',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="importance"
                    fill="#8B79C2"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                    isAnimationActive
                    animationDuration={650}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: Engineered physics features (Strain &amp; Shaft Power) contribute 51.1% of total
            predictive separation.
          </p>
        </div>
      </div>

      {/* ROC Curve + Precision-Recall Curve */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            ROC Curve (AUC = 0.991)
          </h2>
          <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
            True Positive Rate vs. False Positive Rate
          </p>
          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ROC_CURVE_POINTS} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4DACB" strokeOpacity={0.45} />
                <XAxis dataKey="fpr" tick={{ fill: '#8B79C2', fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fill: '#8B79C2', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#231A3B',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FBF8F2',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="xgb" name="XGBoost" stroke="#E6FF3D" strokeWidth={2.8} dot={false} />
                <Line type="monotone" dataKey="rf" name="Random Forest" stroke="#8B79C2" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lr" name="Logistic Reg" stroke="#B3265E" strokeWidth={1.6} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: XGBoost reaches 93% true-positive detection at just 5% false-positive rate.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            Precision–Recall Curve
          </h2>
          <p className="mt-1 text-xs text-[#231A3B]/65 dark:text-[#F4EEE4]/65">
            High precision maintained past 90% recall on imbalanced failure cycles
          </p>
          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PR_CURVE_POINTS} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4DACB" strokeOpacity={0.45} />
                <XAxis dataKey="recall" tick={{ fill: '#8B79C2', fontSize: 11 }} />
                <YAxis domain={[0.4, 1]} tick={{ fill: '#8B79C2', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#231A3B',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FBF8F2',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="xgb" name="XGBoost" stroke="#8B79C2" strokeWidth={2.8} dot={false} />
                <Line type="monotone" dataKey="rf" name="Random Forest" stroke="#B3265E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 border-t border-[#E4DACB] pt-3 text-xs text-[#231A3B]/75 dark:border-[#3E3163] dark:text-[#F4EEE4]/75">
            Insight: SMOTE balancing keeps XGBoost precision at 94% even at 93% failure recall.
          </p>
        </div>
      </div>

      {/* ML Pipeline Walkthrough */}
      <div className="rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
        <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
          Training &amp; Feature Engineering Pipeline
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pipelineStages.map((st) => (
            <div key={st.num} className="rounded-xl bg-[#F4EEE4] p-4 dark:bg-[#1E1635]">
              <span className="font-mono text-xs font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">
                Stage {st.num}
              </span>
              <h3 className="mt-1 font-display text-base font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                {st.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                {st.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
