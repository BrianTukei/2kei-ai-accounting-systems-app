import React, { useEffect, useState } from 'react';

export const SystemMonitoringDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/documents/monitoring'); // Connected backend route
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch data');
      
      setJobs(data.jobs || []);
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading Dashboard...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        System Monitoring Dashboard
      </h1>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* JOBS COLUMN */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Recent Jobs (Queue Status)</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {jobs.length === 0 ? <p className="text-gray-500">No recent jobs</p> : jobs.map((job) => (
              <div key={job.id} className="p-3 rounded border text-sm flex flex-col">
                <span className="font-medium">Job: {job.job_type}</span>
                <span className="text-gray-500">File: {job.file_name}</span>
                <div className="flex justify-between mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                      job.status === 'completed' ? 'bg-green-100 text-green-800' 
                      : job.status === 'failed' ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {job.status} (Attempts: {job.attempts})
                  </span>
                  <span className="text-gray-400 text-xs">{new Date(job.created_at).toLocaleString()}</span>
                </div>
                {job.error_payload && <span className="text-red-500 text-xs mt-1">{JSON.stringify(job.error_payload)}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* LOGS COLUMN */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">System Logs (Trace)</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {logs.length === 0 ? <p className="text-gray-500">No recent logs</p> : logs.map((log) => (
              <div key={log.id} className="p-3 rounded bg-gray-50 border-l-4 border-gray-300 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">{log.module} - {log.action}</span>
                  <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-gray-600 mt-1">Status: <span className={log.status === 'failed' ? 'text-red-500 font-medium' : 'text-green-500'}>{log.status}</span></div>
                {log.error_message && <p className="text-red-500 text-xs mt-2 overflow-x-auto bg-red-50 p-2 rounded">{log.error_message}</p>}
                {log.retry_count > 0 && <p className="text-orange-500 text-xs mt-1">Retries: {log.retry_count}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
