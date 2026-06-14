import { create } from 'zustand';

const useProjectStore = create((set) => ({
  projectId: null,
  datasetId: null,
  preview: null,
  columnInfo: null,
  domain: null,
  tasks: [],
  selectedTask: null,
  logs: [],
  status: 'idle',
  report: null,
  confidenceScore: null,
  
  // Prediction Panel State
  featureColumns: null,
  predictionResult: null,
  predictionHistory: [],

  setUploadResult: (data) => set({
    projectId: data.project_id,
    datasetId: data.dataset_id,
    preview: data.preview,
    columnInfo: data.column_info,
    status: 'uploaded'
  }),
  setDomainInfo: (data) => set({ domain: data.domain, tasks: data.tasks }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  addLog: (log) => set(state => ({ logs: [...state.logs, log] })),
  setStatus: (status) => set({ status }),
  setReport: (report) => set({ report, confidenceScore: report.confidence_score, featureColumns: report.feature_columns }),
  
  // Prediction actions
  setFeatureColumns: (columns) => set({ featureColumns: columns }),
  setPredictionResult: (result) => set({ predictionResult: result }),
  addPredictionHistory: (item) => set(state => ({ predictionHistory: [item, ...state.predictionHistory] })),
  clearPredictionResult: () => set({ predictionResult: null }),

  reset: () => set({
    projectId: null, datasetId: null, preview: null, columnInfo: null,
    domain: null, tasks: [], selectedTask: null, logs: [],
    status: 'idle', report: null, confidenceScore: null,
    featureColumns: null, predictionResult: null, predictionHistory: []
  })
}));

export default useProjectStore;
